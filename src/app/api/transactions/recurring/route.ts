import { NextResponse } from "next/server";
import { getFixedFlows } from "@/lib/recurring";

export async function GET() {
  const flows = await getFixedFlows();
  return NextResponse.json(flows);
}
