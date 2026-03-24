import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserOrders } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/orders");
  }

  const orders = await getUserOrders(user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Orders</h2>
      <OrdersClient orders={orders} />
    </div>
  );
}
