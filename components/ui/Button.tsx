import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && "bg-primary text-white hover:bg-primary/90",
          variant === "secondary" &&
            "bg-primary-soft text-primary hover:bg-primary-soft/70 border border-line",
          variant === "ghost" && "text-ink-muted hover:bg-primary-soft/60",
          size === "sm" && "text-sm px-3 py-1.5",
          size === "md" && "text-sm px-4 py-2.5",
          size === "lg" && "text-base px-6 py-3.5",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
