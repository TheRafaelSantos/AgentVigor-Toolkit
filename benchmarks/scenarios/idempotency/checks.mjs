import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accept } from './ledger.mjs';

const ledger = () => ({ total: 0, ids: new Set() });

test('accepts distinct events', () => {
  const account = ledger();
  accept(account, { id: 'a', amount: 2 });
  accept(account, { id: 'b', amount: 3 });
  assert.equal(account.total, 5);
  assert.deepEqual([...account.ids], ['a', 'b']);
});

test('ignores retries by event id', () => {
  const account = ledger();
  accept(account, { id: 'a', amount: 2 });
  accept(account, { id: 'a', amount: 10 });
  assert.equal(account.total, 2);
});

test('rejects invalid new events without mutation', () => {
  const account = ledger();
  assert.throws(() => accept(account, { id: 'b', amount: Number.NaN }), TypeError);
  assert.equal(account.total, 0);
  assert.equal(account.ids.size, 0);
});
