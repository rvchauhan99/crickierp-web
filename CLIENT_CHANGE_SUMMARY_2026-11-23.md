# Changes summary — 23 November 2026

1. **Withdrawal Banker + Final list columns** — Both listings now use the same main column sequence and style as the banker Excel export (Withdrawal ID, Player ID, Account Holder, Account Number, IFSC, Payable Amount, Status, UTR, Payout Bank account number, optional liability columns, Created By, Approved By, Transaction At). Final list keeps Amount, Reverse Bonus, Amendment Count, and Last Amended At after that block. Banker keeps bulk-select and Actions.

4. **Withdrawal Banker — approve from the row** — On requested rows, enter **UTR** and choose **payout bank** (or liability person) in the table, then **Approve** or **Reject** from Actions. **Details** opens the sidebar; clicking the rest of the row does not.

2. **Withdrawal exchange — searchable player bank account** — On create, you can search past beneficiary account numbers across all withdrawals. Choosing a match fills the linked player and bank details automatically. Tab no longer stops on locked/read-only bank fields or the payable preview.

3. **Banker Upload UTRs — Payout Bank by last 4 digits** — In the Upload UTR sheet, enter the last 4 digits of an active company bank account in **Payout Bank**. The system matches Bank Master on those digits and picks that payout bank. Full account number or holder name still works. If more than one active bank shares the same last 4 digits, use the full account number.
