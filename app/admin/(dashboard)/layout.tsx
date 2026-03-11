import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { LogoutButton } from "../components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const authorized = await isAdmin();

    if (!authorized) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 p-6 flex flex-col gap-8">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-brand to-brandBright bg-clip-text text-transparent">RO v2 Admin</h2>
                    <p className="text-[10px] text-muted font-medium uppercase tracking-widest mt-1">Backoffice Central</p>
                </div>

                <nav className="flex flex-col gap-2">
                    <Link href="/admin" className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">Dashboard</Link>
                    <Link href="/" className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium text-muted">Ir para Site</Link>
                </nav>

                <div className="mt-auto space-y-2">
                    <LogoutButton />
                    <p className="px-4 text-[10px] text-zinc-600 font-mono">v2.0.26</p>
                </div>
            </aside>

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
