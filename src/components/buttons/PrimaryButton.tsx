import { ReactNode } from "react";

type ButtonVariant = "default" | "success" | "ghost";

interface PrimaryButtonProps {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  isLoading?: boolean;
}

const baseStyles =
  "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500";

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 disabled:bg-slate-800/50 disabled:border-slate-700/50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 disabled:bg-emerald-900/50 disabled:border-emerald-800/50 disabled:text-emerald-200 disabled:cursor-not-allowed disabled:hover:bg-emerald-900/50",
  ghost:
    "bg-transparent text-slate-300 hover:text-slate-100 border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:border-slate-800",
};

export default function PrimaryButton({
  label,
  icon,
  onClick,
  disabled,
  variant = "default",
  className = "",
  isLoading = false,
}: PrimaryButtonProps) {
  const spinnerIcon = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  /**
   * Creates a safe button click handler that prevents mobile touch event issues.
   * Always prevents default behavior and stops event propagation to avoid
   * accidental triggers on mobile devices.
   */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`.trim()}
    >
      {isLoading ? spinnerIcon : icon && icon}
      {label}
    </button>
  );
}
