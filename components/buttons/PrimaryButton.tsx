import { ReactNode } from "react";

type ButtonVariant = "default" | "success" | "ghost";

type PrimaryButtonProps = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
};

const baseStyles =
  "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500";

const variants: Record<ButtonVariant, string> = {
  default: "bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 disabled:bg-emerald-900/50 disabled:border-emerald-800/50 disabled:text-emerald-200 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-slate-300 hover:text-slate-100 border-slate-700 hover:border-slate-600",
};

export default function PrimaryButton({
  label,
  icon,
  onClick,
  disabled,
  variant = "default",
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`.trim()}
    >
      {icon && icon}
      {label}
    </button>
  );
}
