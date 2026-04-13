// Cloudflare Workers env store.
// Each CF isolate handles one request at a time, so a module-level variable is safe.
import type { Env } from "./index";

let _env: Env | null = null;

export function setCfEnv(env: Env) {
  _env = env;
}

export function getCfEnv(): Env | null {
  return _env;
}
