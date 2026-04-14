import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler for Supabase Auth (Google OAuth redirect flow).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Flow:
 *   1. Exchange the auth `code` for a session.
 *   2. Upsert a row in `profiles` with the user's name and email from Google.
 *   3. If `phone` is still null in profiles, redirect to /auth/complete-profile
 *      so the user can supply their phone number before continuing.
 *   4. Otherwise redirect to the original intent destination:
 *        - "checkout" → /checkout
 *        - "account"  → /account (default)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_missing_code`);
  }

  const cookieStore = await cookies();

  // Read the intent cookie set by GoogleAuthButton before the OAuth redirect
  const intentCookie = cookieStore.get("oauth_intent");
  const intent = intentCookie?.value === "checkout" ? "checkout" : "account";
  const defaultRedirect = intent === "checkout" ? "/checkout" : "/account";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type CookieToSet = { name: string; value: string; options?: any };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
  }

  const user = data.session.user;

  // Resolve the user's name from Google identity data
  const googleIdentity = user.identities?.find((id) => id.provider === "google");
  const googleName =
    (googleIdentity?.identity_data?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";

  // Use the service role client for profile operations so RLS does not block
  // the upsert or the subsequent phone check.
  const adminSupabase = await createServiceRoleClient();

  // Check if a profile already exists for this user
  const { data: existingProfile } = await adminSupabase
    .from("profiles")
    .select("phone, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    // First Google sign-in — insert the profile row
    await adminSupabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      name: googleName,
    });
  }

  // Clear the intent cookie regardless of what happens next
  cookieStore.set("oauth_intent", "", { path: "/", maxAge: 0 });

  // Re-fetch phone in case the insert just ran (existingProfile was null)
  const phone = existingProfile?.phone ?? null;

  // If phone is missing, send the user to the complete-profile step.
  // Carry the original intent so we can redirect correctly after they submit.
  if (!phone) {
    const completeUrl = new URL(`${origin}/auth/complete-profile`);
    completeUrl.searchParams.set("intent", intent);
    return NextResponse.redirect(completeUrl.toString());
  }

  return NextResponse.redirect(`${origin}${defaultRedirect}`);
}
