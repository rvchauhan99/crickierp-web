# Changes summary — 20 November 2026

1. **Deposit Exchange** — Player ID is now visible in the list and when you open a deposit to settle.
2. **Bank Summary** — Auto refresh can be turned on/off, and you can choose how often it refreshes (5 to 60 seconds).
3. **Dashboard – Exchange Summary** — When viewing all statuses, amounts and counts include pending (not only settled).
4. **Dashboard – Distribution chart** — Chart also includes pending deposits, withdrawals, and expenses.
5. **Deposit / Withdrawal approval drawers** — Tab goes straight to the fields you need (player, bonus, UTR, bank) and then Save/Approve. Close, Copy, Reject, and Clear are mouse-only so you are not stopped by extra tabs.
6. **Withdrawal Exchange / Final** — **Approved By** now shows the banker who approved the payout (new approvals are stored; older approved rows are filled from audit history when available).
7. **Withdrawal Banker – Upload UTRs** — Export pending (or approved/rejected/all) with banker-first columns (Withdrawal ID, player bank details, UTR, payout bank). Fill UTR + payout bank, upload the same file, validate, then confirm to approve and settle. Already approved/rejected rows are skipped.
8. **Deposit / Withdrawal history for staff** — Sub-admins (and other non-superadmin users) only see the last **24 hours** of deposit and withdrawal list/export data. Superadmin still sees full history. Window is controlled by server setting `DEPOSIT_WITHDRAWAL_LOOKBACK_HOURS`.
9. **Due time** — On deposit and withdrawal lists, Due time keeps counting only while the row is open (pending / requested). After settle, approve, or reject, it freezes at the decision time instead of growing forever.
10. **Withdrawal bank account lock (optional)** — When enabled on the server (`WITHDRAWAL_PLAYER_ACCOUNT_LOCK_MODE`), creating/editing a withdrawal blocks reuse of the same player bank account against the chosen rule (account ownership, or strict one-player–one-account).
