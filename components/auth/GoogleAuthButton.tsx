"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/site.config";

interface GoogleAuthButtonProps {
  /**
   * After Google OAuth completes, Supabase redirects back to /auth/callback.
   * Pass an `intent` so the callback route knows where to send the user next.
   *
   * "checkout"  → redirect to /checkout (used from /checkout-auth)
   * "account"   → redirect to /account  (used from /login and /register)
   */
  intent?: "checkout" | "account";
}

// Google-branded SVG logo per Google's branding guidelines
function GoogleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({ intent = "account" }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!siteConfig.auth.googleAuth.enabled) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Store the intent in a cookie so the callback route can read it after
      // the OAuth round-trip. We use document.cookie (client-side only) with a
      // short max-age; the callback route reads and clears this cookie.
      document.cookie = `oauth_intent=${intent}; path=/; max-age=600; SameSite=Lax`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Prompt the user to select an account each time (optional UX choice)
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      // On success Supabase immediately redirects — no further client code runs.
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-input bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Continue with Google"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <GoogleLogo />
        )}
        <span>Continue with Google</span>
      </button>
      {error && (
        <p className="mt-2 text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

/** Reusable "or" divider that sits between the Google button and the email form */
export function AuthDivider() {
  return (
    <div className="relative flex items-center gap-3" role="separator" aria-label="or">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium shrink-0">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
