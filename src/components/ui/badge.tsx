import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#e2e8f0] bg-[#f3f7f8] px-2.5 py-0.5 text-xs font-bold text-[#001c23] transition-colors",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
