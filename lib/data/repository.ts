import type { ArchiveData } from "@/lib/domain/types";

/**
 * 記録データの保存先を抽象化するインターフェース。
 * 現在は localStorage 実装。将来 DB に移す場合も、この2つのメソッドを実装し直すだけでよい。
 */
export interface SoulArchiveRepository {
  /** 保存データを読む。まだ何も記されていなければ空の記録を返す */
  load(): Promise<ArchiveData>;
  save(data: ArchiveData): Promise<void>;
}
