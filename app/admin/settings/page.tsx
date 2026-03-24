import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDeliverySettings } from "@/lib/supabase/settings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/settings");

  const settings = await getDeliverySettings();

  // Provide safe defaults if the table row doesn't exist yet
  const safeSettings = settings ?? { id: 1, blocked_days: [], blocked_dates: [] };

  return <SettingsClient initialSettings={safeSettings} />;
}
