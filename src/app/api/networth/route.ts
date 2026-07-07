import { NextResponse } from "next/server";
import { calculateNetWorth } from "@/lib/networth";

export async function GET() {
  const snapshot = await calculateNetWorth();
  return NextResponse.json(snapshot);
}
