/**
 * Admin Server Actions
 *
 * CRUD operations for administrator accounts with type-safe validation.
 * Includes role-based access control and password management.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import {
  adminCreateSchema,
  adminUpdateSchema,
  changePasswordSchema,
  idSchema,
} from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

// ============================================================================
// Types
// ============================================================================

export interface AdminListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const updateAdminSchema = adminUpdateSchema.extend({
  id: idSchema,
});

const deleteAdminSchema = z.object({
  id: idSchema,
});

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all administrators, ordered by role then creation date.
 */
export const getAdmins = createAction(async (): Promise<AdminListItem[]> => {
  return prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
});

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new administrator account.
 * Only accessible by admins. Hashes password before storage.
 */
export const createAdmin = createSafeAction(
  adminCreateSchema,
  async (data): Promise<AdminListItem> => {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser, ["admin"])) {
      throw new ActionError("Only administrators can create accounts");
    }

    // Check for duplicate email
    const existing = await prisma.admin.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ActionError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);

    const admin = await prisma.admin.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return admin;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an administrator's name and/or role.
 * Admins can update any account. Editors can only update their own name.
 */
export const updateAdmin = createSafeAction(
  updateAdminSchema,
  async (data): Promise<AdminListItem> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new ActionError("Authentication required");
    }

    const isAdmin = hasRole(currentUser, ["admin"]);
    const isSelf = currentUser.id === data.id;

    // Editors can only update their own name
    if (!isAdmin && !isSelf) {
      throw new ActionError("You can only update your own account");
    }

    if (!isAdmin && data.role) {
      throw new ActionError("Only administrators can change roles");
    }

    // Prevent the last admin from being demoted
    if (data.role && data.role !== "admin") {
      const adminCount = await prisma.admin.count({
        where: { role: "admin", id: { not: data.id } },
      });

      if (adminCount === 0) {
        throw new ActionError(
          "Cannot change role: at least one administrator must remain"
        );
      }
    }

    const admin = await prisma.admin.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return admin;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete an administrator account.
 * Cannot delete yourself or the last administrator.
 */
export const deleteAdmin = createSafeAction(
  deleteAdminSchema,
  async (data): Promise<void> => {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser, ["admin"])) {
      throw new ActionError("Only administrators can delete accounts");
    }

    if (currentUser.id === data.id) {
      throw new ActionError("You cannot delete your own account");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: data.id },
      select: { name: true, role: true },
    });

    if (!admin) {
      throw new ActionError("Administrator not found");
    }

    // Ensure at least one admin remains
    if (admin.role === "admin") {
      const adminCount = await prisma.admin.count({
        where: { role: "admin", id: { not: data.id } },
      });

      if (adminCount === 0) {
        throw new ActionError("Cannot delete the last administrator account");
      }
    }

    await prisma.admin.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Change Password Operation
// ============================================================================

/**
 * Change the current user's password.
 * Requires verification of the current password.
 */
export const changePassword = createSafeAction(
  changePasswordSchema,
  async (data): Promise<void> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new ActionError("Authentication required");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true },
    });

    if (!admin) {
      throw new ActionError("Account not found");
    }

    const isValid = await verifyPassword(
      data.currentPassword,
      admin.passwordHash
    );

    if (!isValid) {
      throw new ActionError("Current password is incorrect");
    }

    const newHash = await hashPassword(data.newPassword);

    await prisma.admin.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    });
  }
);
