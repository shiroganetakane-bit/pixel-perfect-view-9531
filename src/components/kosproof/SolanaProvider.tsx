import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

// Jaringan devnet saja — tidak ada dana nyata.
export const SOLANA_ENDPOINT = "https://api.devnet.solana.com";

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Phantom & Solflare terdeteksi otomatis lewat Wallet Standard.
  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <WalletProvider wallets={[]} autoConnect onError={(error) => toast.error(/reject|denied|cancel/i.test(error.message) ? "Permintaan dibatalkan di dompet." : "Dompet gagal terhubung. Coba lagi di tab baru.")}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
