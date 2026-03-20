"use server";

import { createQuoteRequest } from "@/lib/supabase/queries";

interface QuoteData {
  name: string;
  business: string;
  email: string;
  phone: string | null;
  categories: string[];
  quantity: string;
  frequency: string | null;
  notes: string | null;
}

export async function submitQuoteAction(
  data: QuoteData
): Promise<{ success: boolean; error?: string }> {
  try {
    const quote = await createQuoteRequest(data);
    
    if (quote) {
      return { success: true };
    }
    
    return { success: false, error: "Failed to submit quote request" };
  } catch (error) {
    console.error("Error submitting quote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
