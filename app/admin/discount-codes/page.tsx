"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tag, Plus, Trash2, Loader2 } from "lucide-react";
import type { DiscountCode } from "@/lib/supabase/types";

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", percentage: "", active: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes");
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const pct = Number(form.percentage);
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!pct || pct < 1 || pct > 100) return setFormError("Percentage must be between 1 and 100.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.trim().toUpperCase(), percentage: pct, active: form.active }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Failed to create code.");
      } else {
        setForm({ code: "", percentage: "", active: true });
        await fetchCodes();
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    await fetch("/api/admin/discount-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    await fetch("/api/admin/discount-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Tag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Discount Codes</h1>
          <p className="text-sm text-muted-foreground">Create and manage percentage-based discount codes</p>
        </div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Code</CardTitle>
          <CardDescription>Codes are stored in uppercase and matched case-insensitively at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                maxLength={32}
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label htmlFor="percentage">Discount %</Label>
              <Input
                id="percentage"
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 20"
                value={form.percentage}
                onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="active-toggle"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: !!v }))}
              />
              <Label htmlFor="active-toggle" className="text-sm cursor-pointer">Active</Label>
            </div>
            <Button type="submit" disabled={saving} className="shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Code
            </Button>
          </form>
          {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}
        </CardContent>
      </Card>

      {/* Codes list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Codes</CardTitle>
          <CardDescription>{codes.length} code{codes.length !== 1 ? "s" : ""} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Tag className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No discount codes yet. Create one above.</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_120px_140px_60px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Code</span>
                <span>Discount</span>
                <span>Status</span>
                <span>Created</span>
                <span />
              </div>
              {codes.map((code, i) => (
                <div key={code.id}>
                  {i > 0 && <Separator />}
                  <div className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_120px_140px_60px] gap-2 sm:gap-4 items-start sm:items-center px-6 py-4">
                    <span className="font-mono font-semibold">{code.code}</span>
                    <span className="text-sm">{code.percentage}%</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => handleToggle(code.id, !code.active)}
                        aria-label={`Toggle ${code.code}`}
                      >
                        {code.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Badge variant={code.active ? "default" : "secondary"}>
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(code.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => setDeleteTarget(code)}
                        aria-label={`Delete ${code.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteTarget?.code}&quot;?</DialogTitle>
            <DialogDescription>
              This will permanently remove the discount code. Any orders already placed with this code will not be affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", percentage: "", active: true });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes");
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const pct = Number(form.percentage);
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!pct || pct < 1 || pct > 100) return setFormError("Percentage must be between 1 and 100.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.trim().toUpperCase(), percentage: pct, active: form.active }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Failed to create code.");
      } else {
        setForm({ code: "", percentage: "", active: true });
        await fetchCodes();
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    await fetch("/api/admin/discount-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
  };

  const handleDelete = async (id: string) => {
    setCodes((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/admin/discount-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Tag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Discount Codes</h1>
          <p className="text-sm text-muted-foreground">Create and manage percentage-based discount codes</p>
        </div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Code</CardTitle>
          <CardDescription>Codes are stored in uppercase and matched case-insensitively at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                maxLength={32}
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label htmlFor="percentage">Discount %</Label>
              <Input
                id="percentage"
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 20"
                value={form.percentage}
                onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Switch
                id="active-toggle"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
              <Label htmlFor="active-toggle" className="text-sm">Active</Label>
            </div>
            <Button type="submit" disabled={saving} className="shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Code
            </Button>
          </form>
          {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}
        </CardContent>
      </Card>

      {/* Codes table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Codes</CardTitle>
          <CardDescription>{codes.length} code{codes.length !== 1 ? "s" : ""} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Tag className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No discount codes yet. Create one above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                    <TableCell>{code.percentage}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.active}
                          onCheckedChange={(v) => handleToggle(code.id, v)}
                          aria-label={`Toggle ${code.code}`}
                        />
                        <Badge variant={code.active ? "default" : "secondary"}>
                          {code.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(code.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {code.code}</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete &quot;{code.code}&quot;?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the discount code. Any orders already placed with this code will not be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(code.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
