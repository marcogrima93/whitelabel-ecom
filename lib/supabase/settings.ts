import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

// ── Legacy single-row delivery settings ──────────────────────────────────────
// Kept for backwards compatibility. The new per-method tables are the source
// of truth for the checkout and admin UI going forward.

export interface DeliverySettings {
  id: number;
  blocked_days: number[]; // 0 = Sunday, 1 = Monday, etc.
  blocked_dates: string[]; // Array of "YYYY-MM-DD" strings
}

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("delivery_settings")
    .select("*")
    .single();
  return data || null;
}

export async function updateDeliverySettings(
  blockedDays: number[],
  blockedDates: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("delivery_settings")
    .upsert(
      { id: 1, blocked_days: blockedDays, blocked_dates: blockedDates },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[settings] updateDeliverySettings error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type FulfillmentMethod = "delivery" | "collection";
export type SlotName = "morning" | "afternoon" | "evening";

export interface FulfillmentSlot {
  id: number;
  method: FulfillmentMethod;
  day_of_week: number; // 0 = Mon … 6 = Sun
  slot: SlotName;
  enabled: boolean;
}

// Matrix shape used in the admin UI:  { delivery: { 0: { morning: true, ... }, ... }, collection: { ... } }
export type SlotMatrix = Record<FulfillmentMethod, Record<number, Record<SlotName, boolean>>>;

export interface FulfillmentSettings {
  slots: SlotMatrix;
  blocked_days: Record<FulfillmentMethod, number[]>;
  blocked_dates: Record<FulfillmentMethod, string[]>;
}

// ── Slot Matrix ───────────────────────────────────────────────────────────────

/** Returns the full 42-row slot matrix from fulfillment_slots. */
export async function getFulfillmentSlots(): Promise<FulfillmentSlot[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("fulfillment_slots")
    .select("*")
    .order("method")
    .order("day_of_week")
    .order("slot");

  if (error) {
    console.error("[settings] getFulfillmentSlots error:", error.message);
    return [];
  }
  return (data ?? []) as FulfillmentSlot[];
}

/** Upsert a single slot's enabled state. */
export async function upsertFulfillmentSlot(
  method: FulfillmentMethod,
  day_of_week: number,
  slot: SlotName,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("fulfillment_slots")
    .upsert({ method, day_of_week, slot, enabled }, { onConflict: "method,day_of_week,slot" });

  if (error) {
    console.error("[settings] upsertFulfillmentSlot error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Bulk-save the entire slot matrix in one go (used by admin settings save). */
export async function saveSlotMatrix(
  matrix: SlotMatrix
): Promise<{ ok: boolean; error?: string }> {
  const rows: { method: FulfillmentMethod; day_of_week: number; slot: SlotName; enabled: boolean }[] = [];
  const methods: FulfillmentMethod[] = ["delivery", "collection"];
  const slots: SlotName[] = ["morning", "afternoon", "evening"];

  for (const method of methods) {
    for (let day = 0; day <= 6; day++) {
      for (const slot of slots) {
        rows.push({
          method,
          day_of_week: day,
          slot,
          enabled: matrix[method]?.[day]?.[slot] ?? false,
        });
      }
    }
  }

  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("fulfillment_slots")
    .upsert(rows, { onConflict: "method,day_of_week,slot" });

  if (error) {
    console.error("[settings] saveSlotMatrix error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Blocked Days (recurring, per method) ─────────────────────────────────────

export async function getBlockedDaysPerMethod(): Promise<Record<FulfillmentMethod, number[]>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("fulfillment_blocked_days")
    .select("method, day_of_week");

  if (error) {
    console.error("[settings] getBlockedDaysPerMethod error:", error.message);
    return { delivery: [], collection: [] };
  }

  const result: Record<FulfillmentMethod, number[]> = { delivery: [], collection: [] };
  for (const row of data ?? []) {
    result[row.method as FulfillmentMethod].push(row.day_of_week);
  }
  return result;
}

/** Replace all blocked days for a given method. */
export async function saveBlockedDaysForMethod(
  method: FulfillmentMethod,
  days: number[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();

  // Delete existing rows for this method
  const { error: delError } = await supabase
    .from("fulfillment_blocked_days")
    .delete()
    .eq("method", method);

  if (delError) {
    console.error("[settings] saveBlockedDaysForMethod delete error:", delError.message);
    return { ok: false, error: delError.message };
  }

  if (days.length === 0) return { ok: true };

  const rows = days.map((d) => ({ method, day_of_week: d }));
  const { error: insError } = await supabase
    .from("fulfillment_blocked_days")
    .insert(rows);

  if (insError) {
    console.error("[settings] saveBlockedDaysForMethod insert error:", insError.message);
    return { ok: false, error: insError.message };
  }
  return { ok: true };
}

// ── Blocked Dates (one-off, per method) ───────────────────────────────────────

export async function getBlockedDatesPerMethod(): Promise<Record<FulfillmentMethod, string[]>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("fulfillment_blocked_dates")
    .select("method, date")
    .order("date");

  if (error) {
    console.error("[settings] getBlockedDatesPerMethod error:", error.message);
    return { delivery: [], collection: [] };
  }

  const result: Record<FulfillmentMethod, string[]> = { delivery: [], collection: [] };
  for (const row of data ?? []) {
    result[row.method as FulfillmentMethod].push(row.date);
  }
  return result;
}

/** Replace all blocked dates for a given method. */
export async function saveBlockedDatesForMethod(
  method: FulfillmentMethod,
  dates: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();

  const { error: delError } = await supabase
    .from("fulfillment_blocked_dates")
    .delete()
    .eq("method", method);

  if (delError) {
    console.error("[settings] saveBlockedDatesForMethod delete error:", delError.message);
    return { ok: false, error: delError.message };
  }

  if (dates.length === 0) return { ok: true };

  const rows = dates.map((date) => ({ method, date }));
  const { error: insError } = await supabase
    .from("fulfillment_blocked_dates")
    .insert(rows);

  if (insError) {
    console.error("[settings] saveBlockedDatesForMethod insert error:", insError.message);
    return { ok: false, error: insError.message };
  }
  return { ok: true };
}

// ── Aggregate loader (used by API route) ─────────────────────────────────────

export async function getFulfillmentSettings(): Promise<FulfillmentSettings> {
  const [slotsRows, blockedDays, blockedDates] = await Promise.all([
    getFulfillmentSlots(),
    getBlockedDaysPerMethod(),
    getBlockedDatesPerMethod(),
  ]);

  // Build the slot matrix
  const methods: FulfillmentMethod[] = ["delivery", "collection"];
  const slotNames: SlotName[] = ["morning", "afternoon", "evening"];
  const matrix: SlotMatrix = {
    delivery: {},
    collection: {},
  };
  for (const method of methods) {
    for (let day = 0; day <= 6; day++) {
      matrix[method][day] = { morning: false, afternoon: false, evening: false };
    }
  }
  for (const row of slotsRows) {
    matrix[row.method][row.day_of_week][row.slot] = row.enabled;
  }

  return { slots: matrix, blocked_days: blockedDays, blocked_dates: blockedDates };
}
