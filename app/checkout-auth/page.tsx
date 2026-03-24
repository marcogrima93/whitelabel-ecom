"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, ShoppingBag, UserCheck, UserPlus, ArrowRight, CheckCircle } from "lucide-react";
import { PhoneInput, joinPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      onSuccess();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
        Sign In & Continue
      </Button>
    </form>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone, role: "RETAIL" },
          emailRedirectTo: `${window.location.origin}/checkout`,
        },
      });
      if (authError) { setError(authError.message); return; }
      // If session exists (email confirmation disabled), go straight to checkout
      if (authData.session) {
        onSuccess();
      } else {
        setRegistered(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <div>
          <p className="font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a confirmation link to <span className="font-medium">{formData.email}</span>.
            Click the link to verify and you&apos;ll be taken straight to checkout.
          </p>
        </div>
        {siteConfig.allowGuestCheckout && (
          <p className="text-sm text-muted-foreground">
            Want to checkout now?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={onSuccess}
            >
              Continue as guest
            </button>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input
          id="reg-name"
          value={formData.name}
          onChange={(e) => update("name", e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <PhoneInput
          countryCode={phoneCountryCode}
          number={phoneNumber}
          onCountryCodeChange={(c) => { setPhoneCountryCode(c); update("phone", joinPhone(c, phoneNumber)); }}
          onNumberChange={(n) => { setPhoneNumber(n); update("phone", joinPhone(phoneCountryCode, n)); }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
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
          <Label htmlFor="reg-confirm">Confirm</Label>
          <Input
            id="reg-confirm"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        Create Account & Continue
      </Button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutAuthPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/checkout");
    router.refresh();
  };

  const handleGuest = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.logo} alt={siteConfig.shopName} className="h-8 w-auto object-contain" />
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Before you checkout</h1>
          <p className="text-muted-foreground">
            Sign in to save your details, or create a free account to track your orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sign In */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base leading-tight">Sign In</h2>
                <p className="text-xs text-muted-foreground">Already have an account</p>
              </div>
            </div>
            <Separator />
            <LoginForm onSuccess={handleSuccess} />
          </div>

          {/* Register */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base leading-tight">Create Account</h2>
                <p className="text-xs text-muted-foreground">New to {siteConfig.shopName}</p>
              </div>
            </div>
            <Separator />
            <RegisterForm onSuccess={handleSuccess} />
          </div>
        </div>

        {/* Guest CTA — hidden when allowGuestCheckout is false */}
        {siteConfig.allowGuestCheckout && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Separator className="w-full max-w-sm" />
            <p className="text-sm text-muted-foreground">Prefer not to create an account?</p>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={handleGuest}
            >
              Continue as Guest
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Your cart is preserved — no items will be lost.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
