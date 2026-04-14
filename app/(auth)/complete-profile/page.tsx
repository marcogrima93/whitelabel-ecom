"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { PhoneInput, joinPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") ?? "account";

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fullPhone = joinPhone(countryCode, phoneNumber);
    if (phoneNumber.trim().length < 5) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const payload: Database["public"]["Tables"]["profiles"]["Update"] = { phone: fullPhone };
    const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to save your phone number. Please try again.");
      setLoading(false);
      return;
    }

    const destination = intent === "checkout" ? "/checkout" : "/account";
    router.push(destination);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">One last step</CardTitle>
        <CardDescription>
          Please add your phone number so we can contact you about your orders.
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
            <Label htmlFor="phone-number">Phone Number</Label>
            <PhoneInput
              countryCode={countryCode}
              number={phoneNumber}
              onCountryCodeChange={setCountryCode}
              onNumberChange={setPhoneNumber}
              required
              id="phone-number"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
