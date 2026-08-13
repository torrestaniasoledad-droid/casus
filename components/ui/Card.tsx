import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-surface border border-line rounded-lg p-5 shadow-[0_1px_2px_rgba(14,59,54,0.04)]",
        className
      )}
      {...props}
    />
  );
}
