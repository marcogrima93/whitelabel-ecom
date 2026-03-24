"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Check query params for Supabase error (expired / used link)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    const errorCode = params.get("error_code");
    const errorDesc = params.get("error_description");

    if (urlError) {
      setLinkError(
        errorCode === "otp_expired"
          ? "This password reset link has expired or has already been used. Please request a new one."
          : errorDesc?.replace(/\+/g, " ") || "This reset link is invalid. Please request a new one."
      );
      return;
    }

    // 2. Also check the hash fragment (Supabase sometimes puts errors there too)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashError = hashParams.get("error");
    const hashErrorCode = hashParams.get("error_code");
    const hashErrorDesc = hashParams.get("error_description");

    if (hashError) {
      setLinkError(
        hashErrorCode === "otp_expired"
          ? "This password reset link has expired or has already been used. Please request a new one."
          : hashErrorDesc?.replace(/\+/g, " ") || "This reset link is invalid. Please request a new one."
      );
      return;
    }

    // 3. Valid token — listen for the PASSWORD_RECOVERY event
    let unsubscribe: (() => void) | undefined;
    const exchangeToken = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setReady(true);
      });
      unsubscribe = () => subscription.unsubscribe();

      // Handle page reload after token was already exchanged
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setReady(true);
    };
    exchangeToken();

    return () => unsubscribe?.();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setFormError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Password Updated</CardTitle>
          <CardDescription>
            Your password has been changed. Redirecting you to login...
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (linkError) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Link Expired</CardTitle>
          <CardDescription className="text-balance">{linkError}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a New Reset Link</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Verifying your reset link...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set New Password</CardTitle>
        <CardDescription>
          Choose a strong new password for your {siteConfig.shopName} account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="rp-password">New Password</Label>
            <div className="relative">
              <Input
                id="rp-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-confirm">Confirm New Password</Label>
            <Input
              id="rp-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
