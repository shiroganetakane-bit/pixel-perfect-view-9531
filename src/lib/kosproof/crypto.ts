export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Text(text: string) {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

export async function sha256File(file: Blob) {
  return toHex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "File harus berupa gambar (JPG, PNG, dll).";
  if (file.size > MAX_FOTO_BYTES) return "Ukuran foto maksimal 5 MB.";
  if (file.size === 0) return "File kosong.";
  return null;
}

/** Gambar kecil untuk ditampilkan; hash tetap dihitung dari file asli. */
export function makePreview(file: File, max = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca."));
    };
    img.src = url;
  });
}

export function shortKey(k: string | null | undefined) {
  if (!k) return "-";
  return k.length > 10 ? `${k.slice(0, 4)}…${k.slice(-4)}` : k;
}

export function isSolanaAddress(s: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}
