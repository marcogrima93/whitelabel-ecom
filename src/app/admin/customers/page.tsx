import { getAllCustomers } from "@/modules/ecom/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCustomersPage() {
  const customers = await getAllCustomers();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.phone || "—"}</TableCell>
              <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
