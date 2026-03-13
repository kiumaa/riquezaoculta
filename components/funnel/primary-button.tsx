import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: ReactNode;
};

export function PrimaryButton({ loading, loadingText, children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-5 py-3.5 text-sm font-semibold text-[#04140c] shadow-hero transition-all duration-300 hover:scale-[1.02] hover:shadow-glow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${className}`}
      {...props}
    >
      {/* Shimmer sweep no hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <span className="relative">
        {loading ? (
          loadingText || "A processar..."
        ) : children}
      </span>
    </button>
  );
}
