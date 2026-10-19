<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## KosProof rules
- All data access goes through `src/lib/kosproof/store.ts` (service layer, localStorage for now) so it can later be swapped for a backend / Solana program without touching pages.
- Wallets are detected via Wallet Standard (`WalletProvider wallets={[]}`), devnet only; never request private keys or seed phrases.
- Only hashes, public keys, statuses and timestamps are meant for chain; photos/notes stay off-chain.
