import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import { setCfEnv } from "../src/db/cf-env";
import type { Env } from "../src/db/index";

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, envOrOpts?: unknown) {
    // In Cloudflare Workers, second arg is env with D1 bindings
    if (
      envOrOpts &&
      typeof envOrOpts === "object" &&
      "DB" in (envOrOpts as Record<string, unknown>)
    ) {
      setCfEnv(envOrOpts as Env);
    }
    return handler(request, envOrOpts as { context?: undefined } | undefined);
  },
};
