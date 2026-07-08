import { NextRequest, NextResponse } from "next/server";
import { getExcludeDebtInterest, setExcludeDebtInterest } from "@/lib/projection-settings";

export async function GET() {
  const excludeDebtInterest = await getExcludeDebtInterest();
  return NextResponse.json({ excludeDebtInterest });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { excludeDebtInterest } = body as { excludeDebtInterest?: unknown };

  if (typeof excludeDebtInterest !== "boolean") {
    return NextResponse.json({ error: "excludeDebtInterest must be a boolean" }, { status: 400 });
  }

  await setExcludeDebtInterest(excludeDebtInterest);
  return NextResponse.json({ excludeDebtInterest });
}
