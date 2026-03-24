"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { PhoneInput, joinPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    customerType: "RETAIL" as "RETAIL" | "WHOLESALE",
    businessName: "",
    vatNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();

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
          data: {
            name: formData.name,
            phone: formData.phone,
            role: formData.customerType,
            business_name:
              formData.customerType === "WHOLESALE" ? formData.businessName : null,
            vat_number:
              formData.customerType === "WHOLESALE" ? formData.vatNumber : null,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If Supabase confirms the email is required, session will be null.
      if (!authData.session || formData.customerType === "WHOLESALE") {
        setSuccess(true);
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Account Created!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {formData.customerType === "WHOLESALE" && (
            <div className="bg-primary/10 text-primary p-4 rounded-lg">
              <p className="font-medium">{siteConfig.wholesale.pendingMessage}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Please check your email to verify your account.
            {formData.customerType === "WHOLESALE"
              ? " Once your wholesale account is approved, you'll have access to wholesale pricing."
              : " Click the verification link we just sent you to activate your account."}
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Join {siteConfig.shopName} today
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
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
            <Label htmlFor="reg-phone">Phone</Label>
            <PhoneInput
              id="reg-phone"
              countryCode={phoneCountryCode}
              number={phoneNumber}
              onCountryCodeChange={(c) => {
                setPhoneCountryCode(c);
                update("phone", joinPhone(c, phoneNumber));
              }}
              onNumberChange={(n) => {
                setPhoneNumber(n);
                update("phone", joinPhone(phoneCountryCode, n));
              }}
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
              <Label htmlFor="reg-confirm">Confirm Password</Label>
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

          {/* Customer type */}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update("customerType", "RETAIL")}
                className={`p-3 rounded-lg border text-sm text-center transition-all ${
                  formData.customerType === "RETAIL"
                    ? "border-primary bg-primary/5 ring-2 ring-primary font-medium"
                    : "border-input hover:bg-accent"
                }`}
              >
                {siteConfig.auth.retailLabel}
              </button>
              {siteConfig.wholesale.enabled && (
                <button
                  type="button"
                  onClick={() => update("customerType", "WHOLESALE")}
                  className={`p-3 rounded-lg border text-sm text-center transition-all ${
                    formData.customerType === "WHOLESALE"
                      ? "border-primary bg-primary/5 ring-2 ring-primary font-medium"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {siteConfig.auth.wholesaleLabel}
                </button>
              )}
            </div>
          </div>

          {/* Wholesale fields */}
          {formData.customerType === "WHOLESALE" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="reg-business">Business Name</Label>
                <Input
                  id="reg-business"
                  value={formData.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-vat">VAT / Company Number</Label>
                <Input
                  id="reg-vat"
                  value={formData.vatNumber}
                  onChange={(e) => update("vatNumber", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
