import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  withArrow?: boolean;
  className?: string;
}

/** 画面遷移を伴うボタン。見た目は .btn 系のクラスで統一する */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  withArrow = false,
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)}
    >
      <span>{children}</span>
      {withArrow && <Icon name="arrow" className="h-4 w-4" />}
    </Link>
  );
}
