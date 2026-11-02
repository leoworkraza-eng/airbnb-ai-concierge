import { NextResponse } from "next/server";
import { signOutHost } from "@/lib/auth";

export async function POST(request: Request) {
  await signOutHost();
  return NextResponse.redirect(new URL("/host/login", request.url), { status: 303 });
}

export async function GET(request: Request) {
  await signOutHost();
  return NextResponse.redirect(new URL("/host/login", request.url));
}
