import { localStorageRepository } from "./local-storage-repository";
import type { SoulArchiveRepository } from "./repository";

/**
 * アプリ全体で使うリポジトリ。
 * 保存方式を変えるときは、この1行を差し替えるだけでよい。
 */
export const repository: SoulArchiveRepository = localStorageRepository;
