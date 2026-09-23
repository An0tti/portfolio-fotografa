import { NextResponse } from "next/server";
import { requireAdmin } from "@/application/auth/session";
import { authErrorResponse, privateHeaders } from "@/application/auth/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin(true);
    return NextResponse.json({ authorized: true }, { headers: privateHeaders });
  } catch (error) { return authErrorResponse(error); }
}
