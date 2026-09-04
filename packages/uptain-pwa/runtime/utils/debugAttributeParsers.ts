export type DebugTableRows = Array<Record<string, unknown>>;

/** Converts JS-style object (unquoted keys) to valid JSON by quoting keys */
const unquotedKeysToJson = (s: string): string =>
  s.replace(/([{,]\s*)(\d+|\w+)(\s*):/g, '$1"$2"$3:');

/** Converts single-quoted strings to double-quoted for JSON.parse */
const singleQuotedToDoubleQuoted = (s: string): string =>
  s.replace(/'((?:[^'\\]|\\.)*)'/g, (_, content) =>
    '"' + content.replace(/\\'/g, "'").replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
  );

export const tryParseJson = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const unescaped = raw
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    if (unescaped === raw) return null;

    try {
      return JSON.parse(unescaped) as unknown;
    } catch {
      try {
        const withQuotedKeys = unquotedKeysToJson(unescaped);
        const jsonReady = singleQuotedToDoubleQuoted(withQuotedKeys);
        return JSON.parse(jsonReady) as unknown;
      } catch {
        return null;
      }
    }
  }
};

export const parseWishlistDebugRows = (value: string): DebugTableRows | null => {
  if (!value) return null;

  const parsed = tryParseJson(value);
  if (!parsed || typeof parsed !== 'object') return null;

  if (Array.isArray(parsed)) {
    const rows = parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    return rows.length > 0 ? rows : null;
  }

  const values = Object.values(parsed as Record<string, unknown>);
  const looksLikeMap = values.some((v) => !!v && typeof v === 'object');
  if (looksLikeMap) {
    const rows = values.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object');
    return rows.length > 0 ? rows : null;
  }

  return [parsed as Record<string, unknown>];
};

