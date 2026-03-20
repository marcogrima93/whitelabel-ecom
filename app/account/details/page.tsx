import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import AccountDetailsClient from "./AccountDetailsClient";

export default async function AccountDetailsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?redirect=/account/details");
  }

  const profile = await getCurrentUserProfile();

  return (
    <AccountDetailsClient 
      initialProfile={{
        name: profile?.name || "",
        email: user.email || "",
        phone: profile?.phone || "",
      }}
      userId={user.id}
    />
  );
}
