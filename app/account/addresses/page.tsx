import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAddresses } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import AddressesClient from "./AddressesClient";

export default async function AddressesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  const addresses = await getUserAddresses(user.id);

  return <AddressesClient initialAddresses={addresses} userId={user.id} />;
}
