import Link from "next/link";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function LinkButton({
  href,
  variant,
  size = "lg",
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & ButtonVariantProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
