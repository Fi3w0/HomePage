// Minecraft Server List Ping (post-1.7 protocol).
// Hand-rolled TCP handshake — no deps. We only ever read status, never login.

function writeVarInt(value: number): number[] {
  const out: number[] = [];
  let v = value >>> 0;
  while (true) {
    if ((v & ~0x7f) === 0) { out.push(v); return out; }
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
}

function readVarInt(buf: Uint8Array, offset: number): [value: number, bytes: number] {
  let result = 0, shift = 0, i = 0;
  while (true) {
    if (offset + i >= buf.length) throw new Error("truncated varint");
    const b = buf[offset + i++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return [result, i];
    shift += 7;
    if (shift >= 35) throw new Error("varint too big");
  }
}

function strBytes(s: string): number[] {
  const utf8 = [...new TextEncoder().encode(s)];
  return [...writeVarInt(utf8.length), ...utf8];
}

function packet(id: number, ...payloads: number[][]): Uint8Array {
  const inner = [...writeVarInt(id)];
  for (const p of payloads) inner.push(...p);
  return new Uint8Array([...writeVarInt(inner.length), ...inner]);
}

// Flatten a chat-component description (string OR { text, extra: [...] }) to plain text.
function flattenDescription(desc: unknown): string {
  if (typeof desc === "string") return desc;
  if (desc && typeof desc === "object") {
    const d = desc as { text?: string; extra?: unknown[] };
    let s = d.text ?? "";
    if (Array.isArray(d.extra)) for (const e of d.extra) s += flattenDescription(e);
    return s;
  }
  return "";
}

// Strip §-style legacy color codes.
const stripColorCodes = (s: string) => s.replace(/§[0-9a-fk-or]/gi, "");

export interface McOnline {
  online: true;
  version: { name: string; protocol: number };
  players: { online: number; max: number; sample?: { name: string; id: string }[] };
  description: string;
  favicon?: string;
  ping_ms: number;
  cpu?: number;
  ram?: number;
  ram_limit?: number;
}
export interface McOffline { online: false; error: string }
export type McStatus = McOnline | McOffline;

export function pingServer(host: string, port: number, timeoutMs = 3000): Promise<McStatus> {
  const handshake = packet(
    0x00,
    writeVarInt(763), // protocol version (any modern value works for status)
    strBytes(host),
    [(port >> 8) & 0xff, port & 0xff],
    writeVarInt(1), // next state = status
  );
  const statusReq = packet(0x00);

  return new Promise((resolve) => {
    let buf = new Uint8Array(0);
    let started = 0;
    let done = false;

    const finish = (val: McStatus) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(val);
    };

    const timer = setTimeout(() => finish({ online: false, error: "timeout" }), timeoutMs);

    function tryParse(s: { end(): void } | null) {
      if (done || buf.length === 0) return;
      try {
        const [pktLen, lenBytes] = readVarInt(buf, 0);
        if (buf.length < lenBytes + pktLen) return;
        let off = lenBytes;
        const [, idBytes] = readVarInt(buf, off); off += idBytes;
        const [strLen, strLenBytes] = readVarInt(buf, off); off += strLenBytes;
        if (buf.length < off + strLen) return;
        const json = new TextDecoder().decode(buf.slice(off, off + strLen));
        const ping_ms = Math.round(performance.now() - started);
        try { s?.end(); } catch {}
        const parsed = JSON.parse(json);
        finish({
          online: true,
          version: parsed.version ?? { name: "?", protocol: 0 },
          players: parsed.players ?? { online: 0, max: 0 },
          description: stripColorCodes(flattenDescription(parsed.description)).trim(),
          favicon: parsed.favicon,
          ping_ms,
        });
      } catch { /* keep buffering until enough bytes arrive */ }
    }

    Bun.connect({
      hostname: host,
      port,
      socket: {
        open(s) {
          started = performance.now();
          s.write(handshake);
          s.write(statusReq);
        },
        data(s, data) {
          const merged = new Uint8Array(buf.length + data.length);
          merged.set(buf); merged.set(data, buf.length);
          buf = merged;
          tryParse(s);
        },
        error(_s, err) { finish({ online: false, error: err?.message ?? String(err) }); },
        // NeoForge closes connection right after sending status response,
        // so close() may fire before or alongside data(). Attempt a final parse.
        close() { tryParse(null); finish({ online: false, error: "closed" }); },
      },
    }).catch((err) => finish({ online: false, error: err?.message ?? String(err) }));
  });
}
