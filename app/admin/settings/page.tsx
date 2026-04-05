import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFulfillmentSettings } from "@/lib/supabase/settings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/settings");

  const settings = await getFulfillmentSettings();

  return <SettingsClient initialSettings={settings} />;
}
