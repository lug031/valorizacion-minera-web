import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full border-0 border-b-2 border-[#001c23] bg-slate-100 px-3 py-2 text-sm text-[#001c23] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#64748b] focus-visible:border-[#008ba3] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
