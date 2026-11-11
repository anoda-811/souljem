/**
 * 記録データの保存先。アカウントごとの鍵を渡して作る。
 * 保存方式（localStorage → DB など）を変えるときは、この実装を差し替える。
 */
export { createLocalStorageRepository as createRepository } from "./local-storage-repository";
export type { SoulArchiveRepository } from "./repository";
