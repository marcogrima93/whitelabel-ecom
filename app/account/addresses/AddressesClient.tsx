"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Address } from "@/lib/supabase/types";
import { siteConfig } from "@/site.config";
import { PhoneInput, joinPhone, splitPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";
import { addAddressAction, updateAddressAction, deleteAddressAction } from "./actions";

interface AddressesClientProps {
  initialAddresses: Address[];
  userId: string;
}

const towns = siteConfig.delivery.towns;

export default function AddressesClient({ initialAddresses, userId }: AddressesClientProps) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [formData, setFormData] = useState({
    label: "Home",
    fullName: "",
    line1: "",
    line2: "",
    town: (towns[0]?.name || "") as string,
    postcode: "",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      label: "Home",
      fullName: "",
      line1: "",
      line2: "",
      town: towns[0]?.name || "",
      postcode: "",
      isDefault: false,
    });
    setPhoneCountryCode(DEFAULT_COUNTRY_CODE);
    setPhoneNumber("");
    setEditingAddress(null);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    const split = splitPhone(address.phone || "");
    setPhoneCountryCode(split.countryCode);
    setPhoneNumber(split.number);
    setFormData({
      label: address.label,
      fullName: address.full_name,
      line1: address.line_1,
      line2: address.line_2 || "",
      town: address.city,
      postcode: address.postcode,
      isDefault: address.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = joinPhone(phoneCountryCode, phoneNumber);

    startTransition(async () => {
      if (editingAddress) {
        const success = await updateAddressAction(editingAddress.id, userId, {
          label: formData.label,
          full_name: formData.fullName,
          phone,
          line_1: formData.line1,
          line_2: formData.line2 || null,
          city: formData.town,
          region: formData.town,
          postcode: formData.postcode,
          is_default: formData.isDefault,
        });

        if (success) {
          setAddresses((prev) =>
            prev.map((a) =>
              a.id === editingAddress.id
                ? {
                    ...a,
                    label: formData.label,
                    full_name: formData.fullName,
                    phone,
                    line_1: formData.line1,
                    line_2: formData.line2 || null,
                    city: formData.town,
                    region: formData.town,
                    postcode: formData.postcode,
                    is_default: formData.isDefault,
                  }
                : formData.isDefault
                  ? { ...a, is_default: false }
                  : a
            )
          );
        }
      } else {
        const newAddress = await addAddressAction({
          user_id: userId,
          label: formData.label,
          full_name: formData.fullName,
          phone,
          line_1: formData.line1,
          line_2: formData.line2 || null,
          city: formData.town,
          region: formData.town,
          postcode: formData.postcode,
          is_default: formData.isDefault,
        });

        if (newAddress) {
          setAddresses((prev) => {
            const updated = formData.isDefault
              ? prev.map((a) => ({ ...a, is_default: false }))
              : prev;
            return [newAddress, ...updated];
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
    });
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    setDeletingId(addressId);
    startTransition(async () => {
      const success = await deleteAddressAction(addressId, userId);
      if (success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Addresses</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  {editingAddress
                    ? "Update your address details below."
                    : "Enter the details for your new address."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr-label">Label</Label>
                    <Input
                      id="addr-label"
                      value={formData.label}
                      onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Home, Office, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-name">Full Name</Label>
                    <Input
                      id="addr-name"
                      value={formData.fullName}
                      onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-phone">Phone</Label>
                  <PhoneInput
                    id="addr-phone"
                    countryCode={phoneCountryCode}
                    number={phoneNumber}
                    onCountryCodeChange={setPhoneCountryCode}
                    onNumberChange={setPhoneNumber}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-line1">Address Line 1</Label>
                  <Input
                    id="addr-line1"
                    value={formData.line1}
                    onChange={(e) => setFormData((p) => ({ ...p, line1: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-line2">Address Line 2 (optional)</Label>
                  <Input
                    id="addr-line2"
                    value={formData.line2}
                    onChange={(e) => setFormData((p) => ({ ...p, line2: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Town / City</Label>
                    <Select
                      value={formData.town}
                      onValueChange={(v) => setFormData((p) => ({ ...p, town: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select town" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {towns.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-post">Postcode</Label>
                    <Input
                      id="addr-post"
                      value={formData.postcode}
                      onChange={(e) => setFormData((p) => ({ ...p, postcode: e.target.value }))}
                      placeholder="e.g. BKR 1234"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addr-default"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, isDefault: !!checked }))
                    }
                  />
                  <Label htmlFor="addr-default" className="text-sm font-normal">
                    Set as default address
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : editingAddress ? (
                    "Save Changes"
                  ) : (
                    "Add Address"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No saved addresses yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add an address to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {addr.label}
                    {addr.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(addr)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{addr.full_name}</p>
                <p>{addr.line_1}</p>
                {addr.line_2 && <p>{addr.line_2}</p>}
                <p>{addr.city}</p>
                <p>{addr.postcode}</p>
                {addr.phone && <p className="mt-1">{addr.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
