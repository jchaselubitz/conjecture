import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "";

  const redirectTo = request.nextUrl.clone();
  if (process.env.NEXT_PUBLIC_CONTEXT !== "development") {
    redirectTo.port = ""; // Clearing the port might help correct the URL
  }
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      redirectTo.searchParams.delete("next");
      if (type === "recovery") {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/login/reset`,
        );
      }
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/${next}`,
      );
    }
    console.log("error", error);
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/error";
  return NextResponse.redirect(redirectTo.href);
}
