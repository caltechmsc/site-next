"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Google sign-in was cancelled",
  missing_code: "Invalid OAuth response",
  email_not_verified: "Please verify your Google email first",
  not_authorized: "This account is not authorized as an administrator",
  oauth_failed: "Google sign-in failed. Please try again",
  invalid_credentials: "Invalid email or password",
};

// ============================================================================
// Login Form
// ============================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check for error in URL params
  React.useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      setError(ERROR_MESSAGES[errorCode]);
    }
  }, [searchParams]);

  // Handle password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Success - redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <>
      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-white/80">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@caltech.edu"
              required
              disabled={isLoading}
              className={cn(
                "h-11 border-white/10 bg-white/5 pl-10 text-white",
                "placeholder:text-white/30",
                "focus:border-primary/50 focus:ring-primary/20",
                "disabled:opacity-50"
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-white/80">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className={cn(
                "h-11 border-white/10 bg-white/5 pl-10 text-white",
                "placeholder:text-white/30",
                "focus:border-primary/50 focus:ring-primary/20",
                "disabled:opacity-50"
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full bg-primary text-white hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="rounded-full bg-black/40 px-4 py-1 text-white/50 backdrop-blur-sm">
            or continue with
          </span>
        </div>
      </div>

      {/* Google Login */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className={cn(
          "h-11 w-full border-white/10 bg-white/5 text-white",
          "hover:bg-white/10 hover:text-white"
        )}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
    </>
  );
}

// ============================================================================
// Login Page
// ============================================================================

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen">
      {/* Background Image - Beckman Institute */}
      <div className="absolute inset-0">
        <Image
          src="/images/beckman.jpg"
          alt="Beckman Institute at Caltech"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Login Card */}
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              <span className="text-primary">MSC</span>
              <span className="mx-2 text-white/40">·</span>
              <span>Admin</span>
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Materials and Process Simulation Center
            </p>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            {/* Card Content */}
            <div className="p-8">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 bg-white/[0.02] px-8 py-4">
              <p className="text-center text-xs text-white/40">
                Access restricted to authorized MSC administrators
              </p>
            </div>
          </div>

          {/* Back to MSC Website */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-black/30 px-4 py-2 text-sm text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
            >
              ← Back to MSC website
            </Link>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 left-4 z-10">
        <p className="text-xs text-white/30">
          Beckman Institute · California Institute of Technology
        </p>
      </div>
    </div>
  );
}
