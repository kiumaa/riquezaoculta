"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ password }),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                router.push("/admin");
            } else {
                const data = await res.json();
                setError(data.error || "Acesso negado");
            }
        } catch {
            setError("Erro ao tentar entrar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <FunnelShell>
            <div className="mx-auto w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
                    <p className="text-sm text-soft">Insere a senha mestre para aceder ao backoffice v2.</p>
                </div>

                <GlassCard>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-widest text-brandBright">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-ink outline-none ring-brand/30 transition focus:ring"
                                autoFocus
                            />
                        </div>

                        {error && <p className="text-center text-xs text-red-400">{error}</p>}

                        <PrimaryButton type="submit" loading={loading}>
                            Entrar
                        </PrimaryButton>
                    </form>
                </GlassCard>
            </div>
        </FunnelShell>
    );
}
