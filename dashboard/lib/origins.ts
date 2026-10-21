const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function parseAllowedOrigins(
  env: Record<string, string | undefined>,
  warn: (message: string) => void = (message) => console.warn(message),
): string[] {
  const configured: Array<{ name: string; value: string }> = [];
  if (Object.hasOwn(env, "ALLOWED_ORIGIN")) {
    configured.push({ name: "ALLOWED_ORIGIN", value: env.ALLOWED_ORIGIN ?? "" });
  }
  if (Object.hasOwn(env, "ALLOWED_ORIGINS")) {
    (env.ALLOWED_ORIGINS ?? "").split(",").forEach((value, index) => {
      configured.push({ name: `ALLOWED_ORIGINS entry ${index + 1}`, value });
    });
  }

  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  const invalid: string[] = [];
  for (const entry of configured) {
    const value = entry.value.trim();
    if (!value) {
      invalid.push(entry.name);
      continue;
    }
    const origin = normalizeOrigin(value);
    if (!origin) {
      invalid.push(entry.name);
      continue;
    }
    origins.add(origin);
  }

  for (const entry of invalid) {
    warn(`[cors] Invalid or empty origin configured in ${entry}`);
  }
  if (invalid.length > 0 && env.NODE_ENV === "production") {
    throw new Error("Invalid CORS origin configuration");
  }
  return [...origins];
}
