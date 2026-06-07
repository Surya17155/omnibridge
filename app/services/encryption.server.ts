import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY env var is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  let key: Buffer;
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === KEY_BYTES * 2) {
    key = Buffer.from(raw, "hex");
  } else {
    key = crypto.scryptSync(raw, "omnibridge-salt", KEY_BYTES);
  }
  return key;
}

export function encryptKey(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptKey(payload: string): string {
  if (!payload.startsWith("v1:")) {
    return payload;
  }
  const parts = payload.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted payload");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

export function isEncrypted(payload: string): boolean {
  return payload.startsWith("v1:");
}
