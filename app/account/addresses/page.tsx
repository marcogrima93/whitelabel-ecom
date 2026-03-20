"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

// Mock addresses
const mockAddresses = [
  { id: "1", label: "Home", fullName: "John Doe", line1: "123 Main St", city: "Valletta", region: "Malta", postcode: "VLT 1000", isDefault: true },
  { id: "2", label: "Office", fullName: "John Doe", line1: "456 Business Ave", city: "Sliema", region: "Malta", postcode: "SLM 1234", isDefault: false },
];

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Addresses</h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Address
        </Button>
      </div>

      {mockAddresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockAddresses.map((addr) => (
            <Card key={addr.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {addr.label}
                    {addr.isDefault && <Badge variant="secondary">Default</Badge>}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{addr.fullName}</p>
                <p>{addr.line1}</p>
                <p>{addr.city}, {addr.region}</p>
                <p>{addr.postcode}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
