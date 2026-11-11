import type { Metadata } from "next";
import { Icon } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { OrnamentDivider } from "@/components/ui/ornament-divider";

export const metadata: Metadata = {
  title: "頁が見つかりません",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ManuscriptCard className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center border border-gilt bg-gilt-mist/50 text-amethyst">
          <Icon name="archive" className="h-7 w-7" />
        </span>
        <p className="mt-6 font-display text-sm italic tracking-[0.2em] text-gilt-deep">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          この頁は、どの書架にも見当たらない。
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          綴じ間違えたか、まだ記されていない頁のようです。
        </p>
        <OrnamentDivider className="my-7" />
        <ButtonLink href="/" withArrow>
          表紙へ戻る
        </ButtonLink>
      </ManuscriptCard>
    </div>
  );
}
