"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, X, CalendarOff, LayoutGrid, Truck, MapPin, Clock } from "lucide-react";
import {
  saveFulfillmentSlotsAction,
  saveBlockedDaysAction,
  saveBlockedDatesAction,
  saveAdvanceDaysAction,
} from "./actions";
import type { SlotMatrix, FulfillmentMethod, FulfillmentSettings, AdvanceDayRule } from "@/lib/supabase/settings";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const SLOTS = [
  { value: "morning" as const, label: "Morning" },
  { value: "afternoon" as const, label: "Afternoon" },
  { value: "evening" as const, label: "Evening" },
];

const BLOCKED_DAYS_FULL = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildEmptyMatrix(): SlotMatrix {
  const matrix: SlotMatrix = { delivery: {}, collection: {} };
  const methods: FulfillmentMethod[] = ["delivery", "collection"];
  for (const method of methods) {
    for (let day = 0; day <= 6; day++) {
      matrix[method][day] = { morning: false, afternoon: false, evening: false };
    }
  }
  return matrix;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STOCK_STATUSES = [
  { value: "IN_STOCK",  label: "In Stock" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "PRE_ORDER", label: "Pre-Order" },
];

const FULFILLMENT_METHODS: { value: FulfillmentMethod; label: string }[] = [
  { value: "delivery",   label: "Delivery" },
  { value: "collection", label: "Collection" },
];

// ── Advance Days Card ─────────────────────────────────────────────────────────

function AdvanceDaysCard({
  rules,
  onChange,
}: {
  rules: AdvanceDayRule[];
  onChange: (rules: AdvanceDayRule[]) => void;
}) {
  const getValue = (status: string, method: FulfillmentMethod): number => {
    const r = rules.find((r) => r.stock_status === status && r.fulfillment_method === method);
    return r?.advance_days ?? 1;
  };

  const setValue = (status: string, method: FulfillmentMethod, days: number) => {
    const next = rules.map((r) =>
      r.stock_status === status && r.fulfillment_method === method
        ? { ...r, advance_days: days }
        : r
    );
    // If the rule doesn't exist yet, add it
    const exists = rules.some((r) => r.stock_status === status && r.fulfillment_method === method);
    if (!exists) {
      onChange([...next, { id: 0, stock_status: status, fulfillment_method: method, advance_days: days }]);
    } else {
      onChange(next);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-32">Stock Status</th>
            {FULFILLMENT_METHODS.map((m) => (
              <th key={m.value} className="text-center py-2 px-4 font-medium text-muted-foreground min-w-[120px]">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STOCK_STATUSES.map((status) => (
            <tr key={status.value} className="border-t border-border">
              <td className="py-3 pr-4 font-medium text-sm">{status.label}</td>
              {FULFILLMENT_METHODS.map((method) => (
                <td key={method.value} className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={getValue(status.value, method.value)}
                      onChange={(e) =>
                        setValue(status.value, method.value, Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="h-8 w-16 text-center text-sm"
                      aria-label={`${status.label} ${method.label} advance days`}
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SettingsClientProps {
  initialSettings: FulfillmentSettings;
}

// ── Slot Matrix Card ──────────────────────────────────────────────────────────

function SlotMatrixCard({
  method,
  matrix,
  onChange,
}: {
  method: FulfillmentMethod;
  matrix: SlotMatrix;
  onChange: (next: SlotMatrix) => void;
}) {
  const toggle = (day: number, slot: "morning" | "afternoon" | "evening") => {
    const next: SlotMatrix = JSON.parse(JSON.stringify(matrix));
    next[method][day][slot] = !next[method][day][slot];
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-24">Day</th>
            {SLOTS.map((s) => (
              <th key={s.value} className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[90px]">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day.value} className="border-t border-border">
              <td className="py-2.5 pr-4 font-medium text-sm">{day.label}</td>
              {SLOTS.map((slot) => {
                const checked = matrix[method]?.[day.value]?.[slot.value] ?? false;
                const id = `slot-${method}-${day.value}-${slot.value}`;
                return (
                  <td key={slot.value} className="text-center py-2.5 px-3">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggle(day.value, slot.value)}
                      aria-label={`${day.label} ${slot.label}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Blocked Days Card ─────────────────────────────────────────────────────────

function BlockedDaysCard({
  method,
  days,
  onChange,
}: {
  method: FulfillmentMethod;
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (day: number) => {
    onChange(
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {BLOCKED_DAYS_FULL.map((day) => (
        <div key={day.value} className="flex items-center gap-2">
          <Checkbox
            id={`blocked-day-${method}-${day.value}`}
            checked={days.includes(day.value)}
            onCheckedChange={() => toggle(day.value)}
          />
          <Label
            htmlFor={`blocked-day-${method}-${day.value}`}
            className="cursor-pointer font-normal"
          >
            {day.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

// ── Blocked Dates Card ────────────────────────────────────────────────────────

function BlockedDatesCard({
  method,
  dates,
  onChange,
}: {
  method: FulfillmentMethod;
  dates: string[];
  onChange: (dates: string[]) => void;
}) {
  const [newDate, setNewDate] = useState("");

  const add = () => {
    const trimmed = newDate.trim();
    if (!trimmed || dates.includes(trimmed)) return;
    onChange([...dates, trimmed].sort());
    setNewDate("");
  };

  const remove = (date: string) => onChange(dates.filter((d) => d !== date));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 max-w-[200px]">
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          aria-label="New blocked date"
        />
        <Button variant="outline" onClick={add} disabled={!newDate} className="w-full">
          Add Date
        </Button>
      </div>
      {dates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No specific dates blocked.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {dates.map((date) => (
            <Badge key={date} variant="secondary" className="gap-1.5 text-sm pl-3">
              {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              <button
                type="button"
                onClick={() => remove(date)}
                className="ml-1 rounded-full hover:text-destructive transition-colors"
                aria-label={`Remove ${date}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Save Button Row ───────────────────────────────────────────────────────────

function SaveRow({
  isPending,
  msg,
  onSave,
}: {
  isPending: boolean;
  msg: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <Button onClick={onSave} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </Button>
      {msg && (
        <p
          className={`text-sm ${
            msg.toLowerCase().includes("saved") ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

// ── Per-Method Tab Content ────────────────────────────────────────────────────

function MethodTab({
  method,
  matrix,
  blockedDays,
  blockedDates,
  onMatrixChange,
  onBlockedDaysChange,
  onBlockedDatesChange,
  onSave,
  saving,
  savedMsg,
}: {
  method: FulfillmentMethod;
  matrix: SlotMatrix;
  blockedDays: number[];
  blockedDates: string[];
  onMatrixChange: (m: SlotMatrix) => void;
  onBlockedDaysChange: (d: number[]) => void;
  onBlockedDatesChange: (d: string[]) => void;
  onSave: () => void;
  saving: boolean;
  savedMsg: string;
}) {
  return (
    <div className="space-y-6">
      {/* Slot matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Available Slots</CardTitle>
              <CardDescription>
                Check each slot to make it bookable for customers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SlotMatrixCard method={method} matrix={matrix} onChange={onMatrixChange} />
        </CardContent>
      </Card>

      {/* Blocked days */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarOff className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Blocked Days &amp; Dates</CardTitle>
              <CardDescription>
                Recurring days and one-off dates unavailable for this method
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Recurring days of the week</p>
            <BlockedDaysCard
              method={method}
              days={blockedDays}
              onChange={onBlockedDaysChange}
            />
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Specific dates (e.g. bank holidays)</p>
            <BlockedDatesCard
              method={method}
              dates={blockedDates}
              onChange={onBlockedDatesChange}
            />
          </div>
        </CardContent>
      </Card>

      <SaveRow isPending={saving} msg={savedMsg} onSave={onSave} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [matrix, setMatrix] = useState<SlotMatrix>(
    initialSettings.slots ?? buildEmptyMatrix()
  );
  const [blockedDays, setBlockedDays] = useState<Record<FulfillmentMethod, number[]>>(
    initialSettings.blocked_days ?? { delivery: [], collection: [] }
  );
  const [blockedDates, setBlockedDates] = useState<Record<FulfillmentMethod, string[]>>(
    initialSettings.blocked_dates ?? { delivery: [], collection: [] }
  );
  const [advanceDays, setAdvanceDays] = useState<AdvanceDayRule[]>(
    initialSettings.advance_days ?? []
  );

  const [isPending, startTransition] = useTransition();
  const [savedMsg, setSavedMsg] = useState<Record<FulfillmentMethod, string>>({
    delivery: "",
    collection: "",
  });
  const [advanceSavedMsg, setAdvanceSavedMsg] = useState("");

  const setMsg = (method: FulfillmentMethod, msg: string) => {
    setSavedMsg((prev) => ({ ...prev, [method]: msg }));
    if (msg.toLowerCase().includes("saved")) {
      setTimeout(() => setSavedMsg((prev) => ({ ...prev, [method]: "" })), 3000);
    }
  };

  const handleSave = (method: FulfillmentMethod) => {
    startTransition(async () => {
      const [slotRes, daysRes, datesRes] = await Promise.all([
        saveFulfillmentSlotsAction(matrix),
        saveBlockedDaysAction(method, blockedDays[method]),
        saveBlockedDatesAction(method, blockedDates[method]),
      ]);

      if (!slotRes.success || !daysRes.success || !datesRes.success) {
        setMsg(
          method,
          slotRes.error ?? daysRes.error ?? datesRes.error ?? "Error saving settings."
        );
      } else {
        setMsg(method, "Settings saved.");
      }
    });
  };

  const handleSaveAdvanceDays = () => {
    startTransition(async () => {
      const rules = advanceDays.map(({ stock_status, fulfillment_method, advance_days }) => ({
        stock_status,
        fulfillment_method,
        advance_days,
      }));
      const res = await saveAdvanceDaysAction(rules);
      if (!res.success) {
        setAdvanceSavedMsg(res.error ?? "Error saving advance days.");
      } else {
        setAdvanceSavedMsg("Advance days saved.");
        setTimeout(() => setAdvanceSavedMsg(""), 3000);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure slot availability, blocked days, and advance booking rules per fulfillment method
        </p>
      </div>

      {/* ── Advance Booking Days ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Advance Booking Days</CardTitle>
              <CardDescription>
                Minimum days ahead a customer must select for each stock status and fulfillment method combination. The noon cutoff (+1 day if ordered at or after 12:00) is applied on top of this value.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdvanceDaysCard rules={advanceDays} onChange={setAdvanceDays} />
          <SaveRow isPending={isPending} msg={advanceSavedMsg} onSave={handleSaveAdvanceDays} />
        </CardContent>
      </Card>

      <Tabs defaultValue="delivery">
        <TabsList className="mb-4">
          <TabsTrigger value="delivery" className="gap-2">
            <Truck className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <MapPin className="h-4 w-4" />
            Collection
          </TabsTrigger>
        </TabsList>

        {(["delivery", "collection"] as FulfillmentMethod[]).map((method) => (
          <TabsContent key={method} value={method}>
            <MethodTab
              method={method}
              matrix={matrix}
              blockedDays={blockedDays[method]}
              blockedDates={blockedDates[method]}
              onMatrixChange={setMatrix}
              onBlockedDaysChange={(d) =>
                setBlockedDays((prev) => ({ ...prev, [method]: d }))
              }
              onBlockedDatesChange={(d) =>
                setBlockedDates((prev) => ({ ...prev, [method]: d }))
              }
              onSave={() => handleSave(method)}
              saving={isPending}
              savedMsg={savedMsg[method]}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
