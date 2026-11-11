import { Icon, type IconName } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { OrnamentDivider } from "@/components/ui/ornament-divider";
import { PageHeader } from "@/components/ui/page-header";

interface ComingSoonProps {
  eyebrow: string;
  title: string;
  lead: string;
  icon: IconName;
  planned: string[];
}

/** まだ実装していない章の仮ページ。世界観を保ったまま、今後の内容を予告する */
export function ComingSoon({ eyebrow, title, lead, icon, planned }: ComingSoonProps) {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />

      <ManuscriptCard className="max-w-3xl">
        <div className="flex items-start gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-gilt bg-gilt-mist/50 text-amethyst">
            <Icon name={icon} className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-xl text-ink">この章の頁は、まだ白紙です。</p>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              次の段階で、ここに観測の場が開かれます。
            </p>
          </div>
        </div>

        <OrnamentDivider className="my-8" />

        <p className="font-display text-sm italic tracking-[0.14em] text-gilt-deep">記される項目</p>
        <ol className="mt-4 space-y-3">
          {planned.map((item, i) => (
            <li key={item} className="flex gap-4 text-[0.98rem] leading-7 text-ink">
              <span className="font-display text-base italic text-gilt-deep">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <ButtonLink href="/" variant="ghost" className="mt-10" withArrow>
          表紙へ戻る
        </ButtonLink>
      </ManuscriptCard>
    </div>
  );
}
