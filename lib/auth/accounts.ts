/**
 * 簡易ログイン。アカウントと、今ログインしている人の情報をブラウザに保存する。
 *
 * 注意：サーバーが無いため、これは「同じブラウザを使う人を分ける」ための仕組み。
 * 見る人がブラウザの保存内容を直接読めば、データは見えてしまう。
 * 複数端末で同期したり、本当に守ったりする段階になったら、サーバーと DB を入れる。
 */

/** アカウント一覧の保存先 */
const ACCOUNTS_KEY = "soul-archive:accounts";
/** ログイン中のアカウントの id */
const SESSION_KEY = "soul-archive:session";
/**
 * 記録の保存先。system アカウントは、版番号を付ける前からあった記録の鍵をそのまま使う。
 * こうすると既存の記録をコピーせずに、そのまま system の記録になる。
 */
const LEGACY_DATA_KEY = "soul-archive:v2";
const DATA_KEY_PREFIX = "soul-archive:data:";

export const SYSTEM_ACCOUNT_ID = "system";
export const SYSTEM_ACCOUNT_NAME = "system";
export const ACCOUNT_NAME_MAX = 20;
export const PASSWORD_MIN = 4;

const ACCOUNTS_SCHEMA_VERSION = 1;
const PBKDF2_ITERATIONS = 150_000;
const UNSUPPORTED_MESSAGE =
  "このブラウザではパスワードを扱えません。https か localhost で開いてください。";

export interface Account {
  id: string;
  name: string;
  /** 仮データの持ち主。パスワード無しでログインできる */
  isSystem: boolean;
  createdAt: string;
  /** パスワードのソルト（base64）。パスワード無しのアカウントは null */
  salt: string | null;
  /** パスワードの PBKDF2 ハッシュ（base64）。生のパスワードは保存しない */
  passwordHash: string | null;
}

/** ログイン中の人の情報。画面と記録の保存先の決定に使う */
export interface SessionUser {
  id: string;
  name: string;
  isSystem: boolean;
  storageKey: string;
}

export type LoginResult = { ok: true; account: Account } | { ok: false; error: string };

interface StoredAccounts {
  schemaVersion: number;
  accounts: Account[];
}

function isAccount(value: unknown): value is Account {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.isSystem === "boolean"
  );
}

function createAccountId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  );
}

function systemAccount(): Account {
  return {
    id: SYSTEM_ACCOUNT_ID,
    name: SYSTEM_ACCOUNT_NAME,
    isSystem: true,
    createdAt: new Date().toISOString(),
    salt: null,
    passwordHash: null,
  };
}

function writeAccounts(accounts: Account[]): void {
  const stored: StoredAccounts = { schemaVersion: ACCOUNTS_SCHEMA_VERSION, accounts };
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(stored));
  } catch {
    // 保存できない環境では、その回のログインだけ有効になる
  }
}

/**
 * アカウント一覧を読む。system アカウントが無ければ作る（仮データの持ち主）。
 * 読めない一覧は消さずに退避してから、空の一覧として扱う。
 */
export function readAccounts(): Account[] {
  let accounts: Account[] = [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredAccounts>;
      if (!Array.isArray(parsed.accounts) || !parsed.accounts.every(isAccount)) {
        throw new Error("アカウント一覧の形が合いません");
      }
      accounts = parsed.accounts;
    }
  } catch {
    if (raw) {
      try {
        window.localStorage.setItem(`${ACCOUNTS_KEY}:backup:${Date.now()}`, raw);
      } catch {
        // 退避もできない環境では、ここでは何もしない
      }
    }
    accounts = [];
  }

  if (!accounts.some((account) => account.isSystem)) {
    accounts = [systemAccount(), ...accounts];
    writeAccounts(accounts);
  }
  return accounts;
}

/** アカウントごとの記録の保存先 */
export function storageKeyFor(account: Pick<Account, "id" | "isSystem">): string {
  return account.isSystem ? LEGACY_DATA_KEY : `${DATA_KEY_PREFIX}${account.id}`;
}

export function toSessionUser(account: Account): SessionUser {
  return {
    id: account.id,
    name: account.name,
    isSystem: account.isSystem,
    storageKey: storageKeyFor(account),
  };
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** 新しいアカウントを作るときの入力の確認。問題があれば、その説明を返す */
export function validateRegistration(
  name: string,
  password: string,
  confirm: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "名前を入力してください。";
  if (trimmed.length > ACCOUNT_NAME_MAX) return `名前は${ACCOUNT_NAME_MAX}文字までです。`;
  if (sameName(trimmed, SYSTEM_ACCOUNT_NAME)) return "その名前は使えません。";
  if (readAccounts().some((account) => sameName(account.name, trimmed))) {
    return "その名前はすでに使われています。";
  }
  if (password.length < PASSWORD_MIN) return `パスワードは${PASSWORD_MIN}文字以上にしてください。`;
  if (password !== confirm) return "確認用のパスワードが一致しません。";
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** パスワードを PBKDF2-SHA256 で導出する。ブラウザの暗号機能が無ければ例外 */
async function derivePasswordHash(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error(UNSUPPORTED_MESSAGE);
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/** 新しいアカウントを作って保存する。入力の確認は validateRegistration で済ませておく */
export async function registerAccount(name: string, password: string): Promise<Account> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const account: Account = {
    id: createAccountId(),
    name: name.trim(),
    isSystem: false,
    createdAt: new Date().toISOString(),
    salt: toBase64(salt),
    passwordHash: await derivePasswordHash(password, salt),
  };
  writeAccounts([...readAccounts(), account]);
  return account;
}

/** 名前とパスワードを確かめる。名前が違うのか、パスワードが違うのかは区別しない */
export async function verifyLogin(name: string, password: string): Promise<LoginResult> {
  const wrong: LoginResult = { ok: false, error: "名前かパスワードが違います。" };
  const account = readAccounts().find((candidate) => sameName(candidate.name, name));
  if (!account) return wrong;

  if (account.passwordHash === null || account.salt === null) {
    // パスワードの無いアカウントは system だけ
    return account.isSystem ? { ok: true, account } : wrong;
  }

  const hash = await derivePasswordHash(password, fromBase64(account.salt));
  return hash === account.passwordHash ? { ok: true, account } : wrong;
}

/** 保存されているログイン中のアカウントの id。ログインしていなければ null */
export function readSessionId(): string | null {
  return window.localStorage.getItem(SESSION_KEY);
}

/** id のアカウントを、ログイン中の人として返す。アカウントが無ければ null */
export function sessionUserFor(id: string): SessionUser | null {
  const account = readAccounts().find((candidate) => candidate.id === id);
  return account ? toSessionUser(account) : null;
}

const sessionListeners = new Set<() => void>();

/** ログイン状態の変化を購読する（同じタブの変更と、別タブの変更の両方） */
export function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function writeSession(accountId: string | null): void {
  try {
    if (accountId) {
      window.localStorage.setItem(SESSION_KEY, accountId);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // 保存できない環境では、再読み込みでログアウトされる
  }
  sessionListeners.forEach((listener) => listener());
}
