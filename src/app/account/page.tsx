import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, Settings } from "lucide-react";

export default async function AccountPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        Welcome back, {profile?.full_name || user.email}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/account/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orderCount || 0}</p>
              <p className="text-xs text-muted-foreground">Total orders</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/addresses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your saved addresses</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Update your profile details</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
