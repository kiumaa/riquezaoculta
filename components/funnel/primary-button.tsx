import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function PrimaryButton({ loading, children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center rounded-xl border border-brand/45 bg-brand px-5 py-3.5 text-sm font-semibold text-[#04140c] shadow-hero transition hover:bg-brandDark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${className}`}
      {...props}
    >
      {loading ? "A processar..." : children}
    </button>
  );
}
