"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, X, CalendarOff } from "lucide-react";
import { saveDeliverySettingsAction } from "./actions";
import type { DeliverySettings } from "@/lib/supabase/settings";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface SettingsClientProps {
  initialSettings: DeliverySettings;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [blockedDays, setBlockedDays] = useState<number[]>(initialSettings.blocked_days ?? []);
  const [blockedDates, setBlockedDates] = useState<string[]>(initialSettings.blocked_dates ?? []);
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const toggleDay = (day: number) => {
    setBlockedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addDate = () => {
    const trimmed = newDate.trim();
    if (!trimmed || blockedDates.includes(trimmed)) return;
    setBlockedDates((prev) => [...prev, trimmed].sort());
    setNewDate("");
  };

  const removeDate = (date: string) => {
    setBlockedDates((prev) => prev.filter((d) => d !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    const result = await saveDeliverySettingsAction(blockedDays, blockedDates);
    setSaving(false);
    setSavedMsg(result.success ? "Settings saved." : result.error || "Error saving.");
    if (result.success) setTimeout(() => setSavedMsg(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure delivery and collection availability
        </p>
      </div>

      {/* Blocked Days & Dates — single card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarOff className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Blocked Days &amp; Dates</CardTitle>
              <CardDescription>
                Set recurring days of the week and specific dates unavailable for delivery or collection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recurring days */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Recurring days of the week</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={blockedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="cursor-pointer font-normal">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Specific dates */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Specific dates (e.g. bank holidays)</p>
            <div className="flex flex-col gap-2 max-w-[200px]">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <Button variant="outline" onClick={addDate} disabled={!newDate} className="w-full">
                Add Date
              </Button>
            </div>

            {blockedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No specific dates blocked.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockedDates.map((date) => (
                  <Badge key={date} variant="secondary" className="gap-1.5 text-sm pl-3">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <button
                      type="button"
                      onClick={() => removeDate(date)}
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
        </CardContent>
      </Card>

      <Separator />

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
        {savedMsg && (
          <p className={`text-sm ${savedMsg.includes("saved") ? "text-emerald-600" : "text-destructive"}`}>
            {savedMsg}
          </p>
        )}
      </div>
    </div>
  );
}
