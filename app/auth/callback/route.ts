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
 * Supabase redirects here after the Google sign-in completes. This route:
 *   1. Exchanges the auth `code` for a session.
 *   2. Populates the user's full_name in their metadata if not already set
 *      (from Google's identity_data on first sign-in).
 *   3. Reads the `oauth_intent` cookie set before the OAuth redirect to decide
 *      where to send the user:
 *        - "checkout" → /checkout (cart is preserved in localStorage)
 *        - "account"  → /account  (default for login/register pages)
 *   4. Clears the intent cookie and redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Default fallback if no intent cookie is present
  let redirectPath = "/account";

  if (!code) {
    // Missing code — redirect to login with an error hint
    return NextResponse.redirect(
      `${origin}/login?error=oauth_missing_code`
    );
  }

  const cookieStore = await cookies();

  // Read the intent cookie set by GoogleAuthButton before the OAuth redirect
  const intentCookie = cookieStore.get("oauth_intent");
  if (intentCookie?.value === "checkout") {
    redirectPath = "/checkout";
  }

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
    return NextResponse.redirect(
      `${origin}/login?error=oauth_callback_failed`
    );
  }

  // Populate full_name from Google identity data on first sign-in
  // if the user's metadata doesn't have a name yet.
  const user = data.session.user;
  const existingName = user.user_metadata?.name as string | undefined;
  if (!existingName) {
    // Google provides full_name in the identity's identity_data
    const googleIdentity = user.identities?.find(
      (id) => id.provider === "google"
    );
    const googleName = googleIdentity?.identity_data?.full_name as
      | string
      | undefined;
    if (googleName) {
      await supabase.auth.updateUser({
        data: { name: googleName },
      });
    }
  }

  // Clear the intent cookie
  cookieStore.set("oauth_intent", "", { path: "/", maxAge: 0 });

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
