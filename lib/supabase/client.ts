import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Supabase への接続。環境変数が無ければ null を返す（画面で設定の案内を出す）。
 * 公開キーは、データの行ごとの権限（RLS）で守られている前提で使う。
 * 新しい Supabase は publishable key、古いものは anon key と呼ぶため、どちらの名前でも読む。
 * Next.js は環境変数を「名前を直接書いた形」でだけ埋め込むので、この書き方にしている。
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publicKey) return null;
  client = createClient(url, publicKey);
  return client;
}
