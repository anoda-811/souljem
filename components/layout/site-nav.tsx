"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/navigation";

interface SiteNavProps {
  variant: "sidebar" | "tabbar";
}

/**
 * 現在のページを判定して強調表示するナビゲーション。
 * 現在地の判定のためだけにクライアントで動く。
 */
export function SiteNav({ variant }: SiteNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "tabbar") {
    return (
      <ul className="grid grid-cols-7">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 pt-2.5 pb-3 text-[0.66rem] tracking-[0.04em] transition-colors",
                  active ? "text-amethyst-deep" : "text-ink-soft hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "h-px w-6 transition-colors",
                    active ? "bg-gilt" : "bg-transparent",
                  )}
                  aria-hidden
                />
                <Icon name={item.icon} className="h-[1.2rem] w-[1.2rem]" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 py-3 pr-4 pl-5 transition-colors",
                active
                  ? "bg-vellum text-amethyst-deep shadow-[inset_2px_0_0_var(--color-gilt)]"
                  : "text-ink hover:bg-vellum/70",
              )}
            >
              <span
                className={cn(
                  "w-5 font-display text-[0.95rem] italic",
                  active ? "text-gilt-deep" : "text-mist group-hover:text-gilt-deep",
                )}
                aria-hidden
              >
                {item.numeral}
              </span>
              <Icon
                name={item.icon}
                className={cn("h-[1.15rem] w-[1.15rem]", active ? "text-amethyst" : "text-ink-soft")}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-medium leading-tight">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[0.72rem] text-ink-soft">{item.sub}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
