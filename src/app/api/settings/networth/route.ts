import { NextRequest, NextResponse } from "next/server";
import {
  NETWORTH_CATEGORY_KEYS,
  getNetWorthExclusions,
  setNetWorthExclusions,
  isNetWorthCategoryKey,
} from "@/lib/networth-settings";

export async function GET() {
  const exclusions = await getNetWorthExclusions();
  return NextResponse.json({
    exclusions,
    categories: NETWORTH_CATEGORY_KEYS.map((key) => ({ key, excluded: exclusions.includes(key) })),
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { exclusions } = body as { exclusions?: unknown };

  if (!Array.isArray(exclusions)) {
    return NextResponse.json({ error: "exclusions must be an array" }, { status: 400 });
  }

  const valid = exclusions.filter(
    (key): key is (typeof NETWORTH_CATEGORY_KEYS)[number] =>
      typeof key === "string" && isNetWorthCategoryKey(key)
  );

  await setNetWorthExclusions(valid);
  return NextResponse.json({ exclusions: valid });
}
