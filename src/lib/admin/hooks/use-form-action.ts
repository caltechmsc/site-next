/**
 * Use Form Action Hook
 *
 * A custom hook for handling form submissions with Server Actions.
 * Provides loading state, error handling, and success callbacks.
 */

"use client";

import { useCallback, useState, useTransition } from "react";
import { type ActionResult, hasFieldErrors } from "@/lib/admin/actions/types";

// ============================================================================
// Types
// ============================================================================

export interface UseFormActionOptions<TData> {
  /** Callback when action succeeds */
  onSuccess?: (data: TData) => void;
  /** Callback when action fails */
  onError?: (error: string) => void;
  /** Whether to reset form after success */
  resetOnSuccess?: boolean;
}

export interface UseFormActionReturn<TInput, TData> {
  /** Execute the action with given input */
  execute: (input: TInput) => Promise<ActionResult<TData>>;
  /** Whether the action is currently executing */
  isPending: boolean;
  /** General error message (non-field specific) */
  error: string | null;
  /** Field-specific validation errors */
  fieldErrors: Record<string, string[]>;
  /** Reset all errors */
  clearErrors: () => void;
  /** Get error message for a specific field */
  getFieldError: (field: string) => string | undefined;
  /** Check if a field has an error */
  hasFieldError: (field: string) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for handling form submissions with Server Actions.
 */
export function useFormAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseFormActionOptions<TData> = {}
): UseFormActionReturn<TInput, TData> {
  const { onSuccess, onError } = options;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const execute = useCallback(
    async (input: TInput): Promise<ActionResult<TData>> => {
      // Clear previous errors
      clearErrors();

      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await action(input);

          if (result.success) {
            onSuccess?.(result.data);
          } else {
            setError(result.error);

            if (hasFieldErrors(result)) {
              setFieldErrors(result.fieldErrors);
            }

            onError?.(result.error);
          }

          resolve(result);
        });
      });
    },
    [action, onSuccess, onError, clearErrors]
  );

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return fieldErrors[field]?.[0];
    },
    [fieldErrors]
  );

  const hasFieldError = useCallback(
    (field: string): boolean => {
      return (fieldErrors[field]?.length ?? 0) > 0;
    },
    [fieldErrors]
  );

  return {
    execute,
    isPending,
    error,
    fieldErrors,
    clearErrors,
    getFieldError,
    hasFieldError,
  };
}

// ============================================================================
// Simplified Hooks
// ============================================================================

/**
 * Simplified hook for mutations that don't need form-level error handling.
 */
export function useMutation<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
  } = {}
): {
  mutate: (input: TInput) => Promise<ActionResult<TData>>;
  isPending: boolean;
} {
  const { execute, isPending } = useFormAction(action, options);

  return {
    mutate: execute,
    isPending,
  };
}

/**
 * Hook for delete operations with confirmation.
 */
export function useDeleteAction<TData = void>(
  action: (id: string) => Promise<ActionResult<TData>>,
  options: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  } = {}
): {
  delete: (id: string) => Promise<ActionResult<TData>>;
  isPending: boolean;
} {
  const [isPending, startTransition] = useTransition();

  const deleteItem = useCallback(
    async (id: string): Promise<ActionResult<TData>> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await action(id);

          if (result.success) {
            options.onSuccess?.();
          } else {
            options.onError?.(result.error);
          }

          resolve(result);
        });
      });
    },
    [action, options]
  );

  return {
    delete: deleteItem,
    isPending,
  };
}
