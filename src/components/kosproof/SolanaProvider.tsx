import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import type { ReactNode } from "react";

// Jaringan devnet saja — tidak ada dana nyata.
export const SOLANA_ENDPOINT = import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Phantom & Solflare terdeteksi otomatis lewat Wallet Standard.
  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
