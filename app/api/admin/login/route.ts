import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const rate = consumeRateLimit(`admin-login:${ip}`, 5, 60_000);
    if (!rate.allowed) {
        return NextResponse.json({ error: "Demasiadas tentativas. Aguarda 1 minuto." }, { status: 429 });
    }

    try {
        const { password } = await req.json();

        if (password === process.env.ADMIN_PASSWORD) {
            await createSession({ role: "admin" });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    } catch {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
