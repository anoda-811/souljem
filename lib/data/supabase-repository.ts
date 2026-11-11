import { getSupabase } from "@/lib/supabase/client";
import type { ArchiveData } from "@/lib/domain/types";
import { createEmptyArchive, decodeArchive, encodeArchive } from "./archive-codec";
import type { SoulArchiveRepository } from "./repository";

const TABLE = "archives";

/**
 * Supabase（Postgres）に、ログイン中の人の記録を1行で保存する実装。
 * 読めなかったときは空の記録を返さず、例外にする（空で上書きすると既存の記録を消してしまうため）。
 */
export function createSupabaseRepository(userId: string): SoulArchiveRepository {
  // 保存は順番に1つずつ送る（後から送った内容が、先の内容を追い越さないように）
  let queue: Promise<void> = Promise.resolve();

  return {
    async load(): Promise<ArchiveData> {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase の設定がありません。");

      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        throw new Error("記録を読み込めませんでした。通信の状態を確かめて、再読み込みしてください。");
      }
      if (!data) return createEmptyArchive();

      const archive = decodeArchive(data.data);
      if (!archive) {
        throw new Error("保存されている記録を読めませんでした。上書きしないよう、ここで止めています。");
      }
      return archive;
    },

    save(data: ArchiveData): Promise<void> {
      queue = queue.then(async () => {
        const supabase = getSupabase();
        if (!supabase) return;
        const { error } = await supabase.from(TABLE).upsert({
          user_id: userId,
          schema_version: encodeArchive(data).schemaVersion,
          data: encodeArchive(data),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          // 保存に失敗しても、画面の操作は続けられるようにする（次の保存で再び送る）
          console.error("記録を保存できませんでした。", error.message);
        }
      });
      return queue;
    },
  };
}
