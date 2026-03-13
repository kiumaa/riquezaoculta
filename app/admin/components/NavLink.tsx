"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";

export function NavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <Link
      href={href as Route}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-brand/15 text-brand border border-brand/20"
          : "text-muted hover:bg-white/5 hover:text-ink"
      }`}
    >
      <span className="opacity-80">{icon}</span>
      {label}
    </Link>
  );
}
