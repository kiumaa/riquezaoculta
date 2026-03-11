import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { clearAllLeads, clearAllCheckouts } from "@/lib/storage";

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = new URL(req.url).searchParams.get("target");

  if (target === "leads") {
    const count = await clearAllLeads();
    return NextResponse.json({ cleared: "leads", count });
  }

  if (target === "checkouts") {
    const count = await clearAllCheckouts();
    return NextResponse.json({ cleared: "checkouts", count });
  }

  return NextResponse.json({ error: "Invalid target. Use ?target=leads or ?target=checkouts" }, { status: 400 });
}
