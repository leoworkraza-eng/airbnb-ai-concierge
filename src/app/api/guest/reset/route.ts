import { NextResponse } from "next/server";
import { clearGuestCookie } from "@/lib/auth";

export async function GET(request: Request) {
  await clearGuestCookie();
  return NextResponse.redirect(new URL("/guest/login", request.url));
}
