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

## Architecture
- All financial math lives in `src/lib/finance/calc.ts` as pure functions (tested in calc.test.ts); pages never compute totals themselves — keeps numbers consistent and avoids double counting.
- Expense status/paid amounts are always derived from installments, and labor status from its payments — never stored, so they cannot drift.
- Materials are an item log only; money is counted from expenses and contracts — avoids counting the same purchase twice.
- Data is held in `FinanceProvider` (src/lib/finance/store.tsx) and persisted to localStorage; swap that module to move to a backend.
