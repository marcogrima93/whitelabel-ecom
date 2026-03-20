"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";

export default function AccountDetailsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Details</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detail-name">Full Name</Label>
                <Input id="detail-name" value={formData.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-phone">Phone</Label>
                <Input id="detail-phone" type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-email">Email</Label>
              <Input id="detail-email" type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="detail-cur-pw">Current Password</Label>
              <Input id="detail-cur-pw" type="password" value={formData.currentPassword} onChange={(e) => update("currentPassword", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detail-new-pw">New Password</Label>
                <Input id="detail-new-pw" type="password" value={formData.newPassword} onChange={(e) => update("newPassword", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-conf-pw">Confirm New Password</Label>
                <Input id="detail-conf-pw" type="password" value={formData.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
