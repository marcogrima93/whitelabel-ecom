import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminPagesPage() {
  const supabase = createServerSupabaseClient();
  const { data: pages } = await supabase.from("pages").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CMS Pages</h1>
      <p className="text-sm text-muted-foreground mb-4">Manage static content pages. Extend with a rich text editor for full CMS capability.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(pages || []).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.title}</TableCell>
              <TableCell>/{p.slug}</TableCell>
              <TableCell><Badge variant={p.is_published ? "default" : "secondary"}>{p.is_published ? "Published" : "Draft"}</Badge></TableCell>
              <TableCell>{new Date(p.updated_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
