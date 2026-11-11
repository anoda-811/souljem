/**
 * 記録データの保存先。ログイン中の人の id を渡して作る。
 * 保存方式を変えるときは、この実装（SoulArchiveRepository を満たすもの）を差し替える。
 */
export { createSupabaseRepository } from "./supabase-repository";
export type { SoulArchiveRepository } from "./repository";
