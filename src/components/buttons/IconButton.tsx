import { ReactNode, cloneElement, isValidElement } from "react";

type IconButtonVariant = "gray" | "green" | "red";

type IconButtonProps = {
  icon: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: IconButtonVariant;
  className?: string;
};

const baseStyles =
  "p-3 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<IconButtonVariant, { button: string; icon: string }> = {
  gray: {
    button: "bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700",
    icon: "text-slate-300",
  },
  green: {
    button:
      "bg-emerald-900/20 hover:bg-emerald-800/40 border border-emerald-700/50",
    icon: "text-emerald-400",
  },
  red: {
    button: "bg-red-900/20 hover:bg-red-800/40 border border-red-700/50",
    icon: "text-red-400",
  },
};

export default function IconButton({
  icon,
  ariaLabel,
  onClick,
  disabled,
  variant = "gray",
  className = "",
}: IconButtonProps) {
  const variantStyles = variants[variant];

  // Clone icon and add color class
  const coloredIcon =
    isValidElement(icon) && typeof icon.type !== "string"
      ? cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: `${variantStyles.icon} ${
            (icon.props as { className?: string }).className || ""
          }`.trim(),
        })
      : icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles.button} ${className}`.trim()}
    >
      {coloredIcon}
    </button>
  );
}
