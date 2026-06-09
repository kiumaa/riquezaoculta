import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { findCheckout } from "@/lib/storage";
import { sendOrderConfirmation, sendReferenceReminder, sendAbandonedCart } from "@/lib/communication-service";
import { z } from "zod";

const schema = z.object({
  reference: z.string().min(1).max(64),
  action: z.enum(["confirmation", "reminder", "abandoned"])
});

// POST /api/admin/communications/send  { reference, action }
// Disparo manual de WhatsApp a partir do admin. Cada envio é registado em
// communicationLogs com trigger "manual" (ver communication-service).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { reference, action } = parsed.data;
  const checkout = await findCheckout(reference);
  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  const ctx = { reference: checkout.reference, trigger: "manual" as const };
  let ok = false;

  if (action === "confirmation") {
    ok = await sendOrderConfirmation(checkout.phone, checkout.name, ctx);
  } else if (action === "reminder") {
    if (checkout.entity === "express") {
      return NextResponse.json(
        { error: "Lembrete de referência só se aplica a pagamentos por Referência (este é Express)." },
        { status: 400 }
      );
    }
    ok = await sendReferenceReminder(
      checkout.phone,
      checkout.name,
      checkout.entity,
      checkout.paymentReference,
      checkout.amount,
      "1h",
      ctx
    );
  } else {
    ok = await sendAbandonedCart(checkout.phone, checkout.name, ctx);
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Falha ao enviar (verifica a sessão OpenWA). O log foi registado." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
