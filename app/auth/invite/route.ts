import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("access_token");
  const email = requestUrl.searchParams.get("email");
  const origin = requestUrl.origin;

  if (token && email) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({
      email,
      token: token,
      type: "invite",
    });
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}`);
}
