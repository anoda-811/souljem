import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

interface ArchiveShortcutsProps {
  recordedDays: number;
  journalEntries: number;
  habitCount: number;
}

interface Shortcut {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  meta: string;
}

/** 過去の記録へ向かう3つの書架への導線 */
export function ArchiveShortcuts({ recordedDays, journalEntries, habitCount }: ArchiveShortcutsProps) {
  const shortcuts: Shortcut[] = [
    {
      href: "/gem",
      icon: "gem",
      title: "ソウルジェムの推移",
      description: "過去の濁りの流れを眺め、波の正体を探る。",
      meta: `記録 ${recordedDays} 日分`,
    },
    {
      href: "/journal",
      icon: "archive",
      title: "日記の書架",
      description: "日付ごとに綴った頁を、カレンダーからめくる。",
      meta: `綴られた頁 ${journalEntries} 枚`,
    },
    {
      href: "/research",
      icon: "flask",
      title: "研究の間",
      description: "睡眠や運動と濁りの関係を、自分の言葉で検証する。",
      meta: `追跡中の習慣 ${habitCount} 件`,
    },
  ];

  return (
    <section className="space-y-6">
      <SectionHeading eyebrow="Archive" title="過去の記録をひらく" />
      <ul className="grid gap-5 md:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.href}>
            <Link
              href={shortcut.href}
              className={cn(
                "manuscript group relative block h-full p-6 transition-colors duration-300",
                "hover:border-gilt",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center border border-gilt/60 bg-gilt-mist/50 text-amethyst transition-colors group-hover:bg-gilt-mist">
                <Icon name={shortcut.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{shortcut.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">{shortcut.description}</p>
              <p className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs tracking-[0.08em] text-ink-soft">
                <span>{shortcut.meta}</span>
                <Icon
                  name="arrow"
                  className="h-4 w-4 text-gilt-deep transition-transform duration-300 group-hover:translate-x-1"
                />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
