// Deliberately incomplete fixture for the benchmark. This module is never loaded by the CLI.
export function accept(ledger, event) {
  ledger.total += event.amount;
  ledger.ids.add(event.id);
}
