/**
 * event-decode.ts — Shared value-decoding helpers for Soroban event parsers.
 *
 * Centralises normaliseData, resolveAddress, resolveSymbol, resolveString and
 * resolveU64 so that every event parser uses the strictest correct behaviour
 * for each, and a fix applies uniformly across all modules.
 *
 * @module event-decode
 */

// Soroban `Address` is an account (G…) or contract (C…) strkey: 56 chars in
// the base-32 alphabet [A-Z2-7], per SEP-23 / RFC-4648.
const ADDRESS_RE = /^[GC][A-Z2-7]{55}$/;

/**
 * Normalise the raw `value` field into a flat array of values. Accepts either
 * an already-decoded array, a `{ vec: [...] }` / `{ _value: [...] }` object, or
 * a JSON-encoded string. When `arity` is 1, a bare scalar is wrapped into a
 * single-element array (used by the batcher parser for single-field payloads).
 */
export function normaliseData(raw: unknown, arity?: number): unknown[] | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw as unknown[];

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj["vec"])) return obj["vec"] as unknown[];
    if (Array.isArray(obj["_value"])) return obj["_value"] as unknown[];
  }

  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as unknown[];
    } catch {
      // Not JSON — fall through.
    }
  }

  return arity === 1 ? [raw] : null;
}

/**
 * Resolve a Soroban Address from a raw event value. Accepts a strkey string
 * (G…/C…) or an `{ address: "…" }` object. Returns null if the value is not a
 * valid 56-character Stellar address strkey.
 */
export function resolveAddress(raw: unknown): string | null {
  if (typeof raw === "string" && ADDRESS_RE.test(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj["address"] === "string" && ADDRESS_RE.test(obj["address"])) {
      return obj["address"];
    }
  }
  return null;
}

/**
 * Resolve a Soroban Symbol from a raw event value. Accepts a plain string or
 * a `{ symbol: "…" }` / `{ sym: "…" }` object (both SDK shapes are handled).
 */
export function resolveSymbol(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj["symbol"] === "string") return obj["symbol"];
    if (typeof obj["sym"] === "string") return obj["sym"];
  }
  return null;
}

/**
 * Resolve a Soroban String from a raw event value. Accepts a plain string or
 * a `{ string: "…" }` object.
 */
export function resolveString(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj["string"] === "string") return obj["string"];
  }
  return null;
}

/**
 * Resolve a Soroban u64 from a raw event value. Accepts a string, number, or
 * a `{ u64: "…" }` object. Returns the value as a string to preserve full
 * 64-bit precision (JS numbers lose precision above 2^53).
 */
export function resolveU64(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj["u64"] === "string") return obj["u64"];
    if (typeof obj["u64"] === "number") return String(obj["u64"]);
  }
  return null;
}
