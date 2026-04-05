"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  addFilterGroupAction,
  deleteFilterGroupAction,
  addFilterOptionAction,
  deleteFilterOptionAction,
} from "./actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  featured?: boolean;
}

interface FilterGroup {
  id: string;
  label: string;
  field: string;
  options: string[];
  sort_order?: number;
}

interface Props {
  initialCategories: Category[];
  initialFilterGroups: FilterGroup[];
}

export default function AdminCatalogueClient({
  initialCategories,
  initialFilterGroups,
}: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [filterGroups, setFilterGroups] = useState(initialFilterGroups);
  const [isPending, startTransition] = useTransition();

  // ── Category form state ─────────────────────────────────────────────
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", image: "", featured: false });

  const openCatDialog = (cat?: Category) => {
    setEditingCat(cat ?? null);
    setCatForm(cat ? { name: cat.name, slug: cat.slug, image: cat.image, featured: cat.featured ?? false } : { name: "", slug: "", image: "", featured: false });
    setCatDialogOpen(true);
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingCat) {
        const ok = await updateCategoryAction(editingCat.id, catForm);
        if (ok) setCategories((prev) => prev.map((c) => c.id === editingCat.id ? { ...c, ...catForm } : c));
      } else {
        const row = await addCategoryAction(catForm);
        if (row) setCategories((prev) => [...prev, row]);
      }
      setCatDialogOpen(false);
    });
  };

  const handleCatDelete = (id: string) => {
    if (!confirm("Delete this category? Products using it will lose their category.")) return;
    startTransition(async () => {
      const ok = await deleteCategoryAction(id);
      if (ok) setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  };

  // ── Filter group form state ─────────────────────────────────────────
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupLabel, setGroupLabel] = useState("");
  const [groupField, setGroupField] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const row = await addFilterGroupAction({ label: groupLabel, field: groupField });
      if (row) setFilterGroups((prev) => [...prev, row]);
      setGroupLabel("");
      setGroupField("");
      setGroupDialogOpen(false);
    });
  };

  const handleGroupDelete = (id: string) => {
    if (!confirm("Delete this filter group and all its options?")) return;
    startTransition(async () => {
      const ok = await deleteFilterGroupAction(id);
      if (ok) setFilterGroups((prev) => prev.filter((g) => g.id !== id));
    });
  };

  // ── Filter option state ─────────────────────────────────────────────
  const [optionInput, setOptionInput] = useState<Record<string, string>>({});

  const handleOptionAdd = (group: FilterGroup) => {
    const value = (optionInput[group.id] || "").trim();
    if (!value) return;
    startTransition(async () => {
      const ok = await addFilterOptionAction({
        group_id: group.id,
        value,
        current_options: group.options,
      });
      if (ok) {
        setFilterGroups((prev) =>
          prev.map((g) => g.id === group.id ? { ...g, options: [...g.options, value] } : g)
        );
      }
      setOptionInput((prev) => ({ ...prev, [group.id]: "" }));
    });
  };

  const handleOptionDelete = (group: FilterGroup, value: string) => {
    startTransition(async () => {
      const ok = await deleteFilterOptionAction({
        group_id: group.id,
        value,
        current_options: group.options,
      });
      if (ok) {
        setFilterGroups((prev) =>
          prev.map((g) => g.id === group.id ? { ...g, options: g.options.filter((o) => o !== value) } : g)
        );
      }
    });
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Catalogue Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage product categories and filter groups. Changes apply immediately to the storefront.
        </p>
      </div>

      {/* ── Categories ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Categories</h2>
            <Badge variant="secondary">{categories.length}</Badge>
          </div>
          <Dialog open={catDialogOpen} onOpenChange={(o) => { setCatDialogOpen(o); if (!o) setEditingCat(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openCatDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCatSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCat ? "Update the category name, slug, and image." : "Enter a name and slug to create a new category."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Name</Label>
                    <Input
                      id="cat-name"
                      value={catForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setCatForm((p) => ({
                          ...p,
                          name,
                          slug: editingCat ? p.slug : autoSlug(name),
                        }));
                      }}
                      placeholder="e.g. Beef"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-slug">Slug</Label>
                    <Input
                      id="cat-slug"
                      value={catForm.slug}
                      onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="e.g. beef"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL-friendly identifier. Used in filters: /products?category=beef
                    </p>
                  </div>
                  <ImageUpload
                    label="Image"
                    folder="categories"
                    value={catForm.image}
                    onChange={(url) => setCatForm((p) => ({ ...p, image: url as string }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image or leave blank for no image.
                  </p>
                </div>

                {/* Featured toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={catForm.featured}
                    onChange={(e) => setCatForm((p) => ({ ...p, featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium leading-none">Show on homepage</p>
                    <p className="text-xs text-muted-foreground mt-1">Featured categories appear in the homepage category grid (max 4 shown).</p>
                  </div>
                </label>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCat ? "Save Changes" : "Add Category"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No categories yet. Add your first category above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Card key={cat.id} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
                  {cat.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/products?category={cat.slug}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCatDialog(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleCatDelete(cat.id)} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Filter Groups ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Filter Groups</h2>
            <Badge variant="secondary">{filterGroups.length}</Badge>
          </div>
          <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Filter Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <form onSubmit={handleGroupSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Filter Group</DialogTitle>
                  <DialogDescription>Create a new filter group label for the product catalogue.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label htmlFor="group-label">Label</Label>
                  <Input
                    id="group-label"
                    value={groupLabel}
                    onChange={(e) => setGroupLabel(e.target.value)}
                    placeholder="e.g. Cut, Size, Grade"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This label appears as the filter heading in the storefront sidebar.
                  </p>
                  <div className="pt-2 space-y-2">
                    <Label htmlFor="group-field">Product Field</Label>
                    <Input
                      id="group-field"
                      value={groupField}
                      onChange={(e) => setGroupField(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      placeholder="e.g. filter_field, cut, grade"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The column on the product that this filter targets (e.g. <code>filter_field</code>). Use lowercase with underscores.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filterGroups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No filter groups yet. Add a group like "Cut" or "Grade" then add options to it.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filterGroups.map((group) => {
              const isExpanded = expandedGroup === group.id;
              return (
                <Card key={group.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="flex items-center gap-2 flex-1 text-left"
                        onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      >
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        <CardTitle className="text-base">{group.label}</CardTitle>
                        <Badge variant="outline" className="text-xs font-mono">{group.field}</Badge>
                        <Badge variant="outline" className="text-xs">{group.options.length} options</Badge>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleGroupDelete(group.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <Badge key={opt} variant="secondary" className="gap-1.5 pr-1">
                            {opt}
                            <button
                              type="button"
                              onClick={() => handleOptionDelete(group, opt)}
                              className="hover:text-destructive transition-colors ml-0.5"
                              aria-label={`Remove ${opt}`}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {group.options.length === 0 && (
                          <p className="text-sm text-muted-foreground">No options yet.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add option, e.g. Steak"
                          value={optionInput[group.id] || ""}
                          onChange={(e) => setOptionInput((p) => ({ ...p, [group.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleOptionAdd(group); } }}
                          className="h-8 text-sm"
                        />
                        <Button size="sm" className="h-8" onClick={() => handleOptionAdd(group)} disabled={isPending}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter or click + to add. Options appear as filter choices on the products page.
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
