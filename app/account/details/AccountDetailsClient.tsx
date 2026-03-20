"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { PhoneInput, joinPhone, splitPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";
import { updateProfileAction, updatePasswordAction } from "./actions";

interface AccountDetailsClientProps {
  initialProfile: {
    name: string;
    email: string;
    phone: string;
  };
  userId: string;
}

export default function AccountDetailsClient({ initialProfile, userId }: AccountDetailsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState({
    name: initialProfile.name,
    email: initialProfile.email,
    phone: initialProfile.phone,
  });

  const split = splitPhone(initialProfile.phone || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(split.countryCode || DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState(split.number);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updatePassword = (field: string, value: string) =>
    setPasswordData((prev) => ({ ...prev, [field]: value }));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProfileSaved(false);

    startTransition(async () => {
      const result = await updateProfileAction(userId, {
        name: formData.name,
        phone: formData.phone,
      });

      if (result.success) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        setError(result.error || "Failed to update profile");
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    startPasswordTransition(async () => {
      const result = await updatePasswordAction(passwordData.newPassword);

      if (result.success) {
        setPasswordSaved(true);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(result.error || "Failed to update password");
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Details</h2>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detail-name">Full Name</Label>
                <Input
                  id="detail-name"
                  value={formData.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-phone">Phone</Label>
                <PhoneInput
                  id="detail-phone"
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-email">Email</Label>
              <Input
                id="detail-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : profileSaved ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detail-new-pw">New Password</Label>
                <Input
                  id="detail-new-pw"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => updatePassword("newPassword", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-conf-pw">Confirm New Password</Label>
                <Input
                  id="detail-conf-pw"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => updatePassword("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" variant="secondary" disabled={isPasswordPending}>
          {isPasswordPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
          ) : passwordSaved ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> Password Updated!</>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </div>
  );
}
