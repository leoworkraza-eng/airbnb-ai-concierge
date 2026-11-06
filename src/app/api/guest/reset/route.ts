import { NextResponse } from "next/server";
import { clearGuestCookie } from "@/lib/auth";
import { signOutGuestAccount } from "@/lib/guest-account";

export async function GET(request: Request) {
  await signOutGuestAccount();
  await clearGuestCookie();
  return NextResponse.redirect(new URL("/guest/login", request.url));
}
