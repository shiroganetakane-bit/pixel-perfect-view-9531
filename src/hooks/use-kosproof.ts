import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useCallback, useEffect, useState } from "react";
import * as store from "@/lib/kosproof/store";
import type { Agreement, Role } from "@/lib/kosproof/types";

/** Daftar perjanjian; `undefined` saat masih memuat. */
export function useAgreements(): Agreement[] | undefined {
  const [items, setItems] = useState<Agreement[] | undefined>(undefined);
  useEffect(() => {
    const load = () => setItems(store.listAgreements());
    load();
    return store.subscribe(load);
  }, []);
  return items;
}

/** `undefined` = memuat, `null` = tidak ditemukan. */
export function useAgreement(id: string): Agreement | null | undefined {
  const [a, setA] = useState<Agreement | null | undefined>(undefined);
  useEffect(() => {
    const load = () => setA(store.getAgreement(id));
    load();
    return store.subscribe(load);
  }, [id]);
  return a;
}

export function useSession() {
  const { publicKey, connected, connecting, signMessage, disconnect } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const [role, setRoleState] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setRoleState(wallet ? store.getRole(wallet) : null);
    load();
    setReady(true);
    return store.subscribe(load);
  }, [wallet]);

  const setRole = useCallback(
    (r: Role) => {
      if (wallet) store.setRole(wallet, r);
    },
    [wallet],
  );

  /** Minta tanda tangan dompet atas teks; mengembalikan signature base58. */
  const signText = useCallback(
    async (text: string) => {
      if (!signMessage) throw new Error("Dompet ini tidak mendukung tanda tangan bukti.");
      const sig = await signMessage(new TextEncoder().encode(text));
      return bs58.encode(sig);
    },
    [signMessage],
  );

  return { wallet, connected, connecting, role, setRole, signText, disconnect, ready };
}
