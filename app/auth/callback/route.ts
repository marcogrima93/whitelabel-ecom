import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  // Upsert profile row — only fills name/email on first sign-in;
  // subsequent logins leave existing data (including phone) untouched.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name: googleName,
      },
      {
        // Only write name/email; never overwrite phone, role, etc. that may
        // already exist from a previous email/password registration.
        onConflict: "id",
        ignoreDuplicates: false,
      }
    )
    .select("phone")
    .single();

  // Clear the intent cookie regardless of what happens next
  cookieStore.set("oauth_intent", "", { path: "/", maxAge: 0 });

  if (profileError) {
    // Non-fatal — proceed to default destination even if upsert failed
    return NextResponse.redirect(`${origin}${defaultRedirect}`);
  }

  // If phone is missing, send the user to the complete-profile step.
  // Carry the original intent so we can redirect correctly after they submit.
  if (!profile?.phone) {
    const completeUrl = new URL(`${origin}/auth/complete-profile`);
    completeUrl.searchParams.set("intent", intent);
    return NextResponse.redirect(completeUrl.toString());
  }

  return NextResponse.redirect(`${origin}${defaultRedirect}`);
}
