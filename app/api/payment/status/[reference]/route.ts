import { NextRequest, NextResponse } from "next/server";
import { env, isProd } from "@/lib/env";
import { getChargeStatus } from "@/lib/providers/payment/kbagency";
import { findCheckout, updateCheckoutStatus } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);

  if (!record) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  if (record.status === "pending") {
    const provider = await getChargeStatus(reference);

    if (provider.status === "paid" || provider.status === "failed") {
      await updateCheckoutStatus(reference, provider.status, provider.raw);
    } else if (!isProd && !env.KB_AGENCY_API_KEY) {
      const createdAt = new Date(record.createdAt).getTime();
      const elapsed = Date.now() - createdAt;
      if (elapsed >= 20_000) {
        await updateCheckoutStatus(reference, "paid", { simulatedAutoPaid: true });
      }
    }
  }

  const refreshed = await findCheckout(reference);

  return NextResponse.json({
    reference,
    status: refreshed?.status ?? "pending"
  });
}
