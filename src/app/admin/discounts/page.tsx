import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminDiscountsPage() {
  const supabase = createServerSupabaseClient();
  const { data: discounts } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Discount Codes</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Min Order</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(discounts || []).map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono font-medium">{d.code}</TableCell>
              <TableCell>{d.type}</TableCell>
              <TableCell>{d.type === "percentage" ? `${d.value}%` : `€${d.value}`}</TableCell>
              <TableCell>€{d.min_order}</TableCell>
              <TableCell>{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ""}</TableCell>
              <TableCell><Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Active" : "Inactive"}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
