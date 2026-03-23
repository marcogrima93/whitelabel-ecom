"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, MapPin } from "lucide-react";
import type { Address } from "@/types/database";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "MT" });

  const supabase = createClient();

  const fetchAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("addresses").insert({ ...form, user_id: user.id, label: "Home" });
    setDialogOpen(false);
    setForm({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "MT" });
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    fetchAddresses();
  };

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Address</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Address</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Address Line 1</Label><Input value={form.line1} onChange={(e) => updateField("line1", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Address Line 2</Label><Input value={form.line2} onChange={(e) => updateField("line2", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => updateField("city", e.target.value)} required /></div>
                <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => updateField("state", e.target.value)} /></div>
                <div className="space-y-2"><Label>Postal Code</Label><Input value={form.postal_code} onChange={(e) => updateField("postal_code", e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full">Save Address</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No saved addresses yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> {addr.label}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{addr.full_name}</p>
                <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postal_code}</p>
                <p>{addr.country}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
