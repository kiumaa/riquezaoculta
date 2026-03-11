import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { findCheckout } from "@/lib/storage";
import { sendRecoveryMessage } from "@/lib/providers/sms/bulkgate";
import { z } from "zod";

const schema = z.object({
  reference: z.string().min(1).max(64)
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const checkout = await findCheckout(parsed.data.reference);

  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  if (checkout.status !== "pending") {
    return NextResponse.json({ error: "Only pending checkouts can be recovered" }, { status: 400 });
  }

  const offerUrl = "www.riquezaoculta.click/oferta";
  const result = await sendRecoveryMessage(checkout.phone, checkout.name, offerUrl);

  if (!result.success) {
    return NextResponse.json({ error: result.reason ?? "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
