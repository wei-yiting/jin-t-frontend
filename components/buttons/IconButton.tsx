import { ReactNode } from "react";

type IconButtonProps = {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
};

export default function IconButton({
  icon,
  onClick,
  ariaLabel,
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 ${className}`.trim()}
    >
      <span className="w-4 h-4 block">{icon}</span>
    </button>
  );
}
