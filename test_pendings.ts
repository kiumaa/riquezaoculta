import { db } from "./db/index";
import { checkouts } from "./db/schema";
import { desc, eq } from "drizzle-orm";
import { getChargeStatus } from "./lib/providers/payment/kbagency";

async function main() {
    console.log("A consultar pagamentos pendentes...");
    const pendingCheckouts = await db.select()
        .from(checkouts)
        .where(eq(checkouts.status, "pending"))
        .orderBy(desc(checkouts.createdAt))
        .limit(20);

    console.log(`Encontrados ${pendingCheckouts.length} checkouts recentes pendentes.\n`);

    for (const c of pendingCheckouts) {
        if (c.paymentReference.startsWith("SIM-") || c.paymentReference.length > 20) {
            console.log(`[PULAR] ${c.reference} (Simulado/Invalido - Ent: ${c.entity}, Ref: ${c.paymentReference})`);
            continue;
        }

        try {
            // Método: a Express não envia entity, ou usa outro padrao, mas default é "reference".
            // Vamos tentar "express" para Entity sem sentido, ou apenas testar ambos.
            let method: "reference" | "express" = "reference";
            if (!c.entity || c.entity === "MCX" || c.amount === parseInt(c.paymentReference, 10)) {
                method = "express";
            }

            const status = await getChargeStatus(c.reference, method);
            console.log(`[${c.reference}] DB: ${c.status} | API: ${status.status} | (${method}) | Data: ${c.createdAt.toISOString()}`);
        } catch (e) {
            console.error(`Erro:`, e);
        }
    }
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
