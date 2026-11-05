import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAuditArtifacts } from '../scripts/audit-artifacts.mjs';

const fixture = () => ({
  'SECURITY-FINDINGS.json': JSON.stringify({ schemaVersion: 1, findings: [
    { id: 'SEC-001', title: 'Tenant authorization', severity: 'High', confidence: 'Confirmed', evidence: 'documentFor returns another tenant document' },
    { id: 'SEC-002', title: 'Quantity ignored', severity: 'Medium', confidence: 'Confirmed', evidence: 'totalCents ignores quantity' },
  ] }),
  'SECURITY-AUDIT.md': 'SEC-001 SEC-002',
  'REMEDIATION-PROMPTS.md': 'First batch SEC-001; remaining SEC-002',
  'AUDIT-HANDOFF.md': 'SEC-001 SEC-002',
});

test('audit evidence requires current artifacts, unique cross-referenced IDs and both fixture defects', () => {
  assert.equal(validateAuditArtifacts(fixture()), true);
  const missing = fixture(); delete missing['SECURITY-FINDINGS.json'];
  assert.equal(validateAuditArtifacts(missing), false);
  const malformed = fixture(); malformed['SECURITY-FINDINGS.json'] = '{';
  assert.equal(validateAuditArtifacts(malformed), false);
  const duplicate = fixture(); duplicate['SECURITY-FINDINGS.json'] = duplicate['SECURITY-FINDINGS.json'].replace('SEC-002', 'SEC-001');
  assert.equal(validateAuditArtifacts(duplicate), false);
  const inconsistent = fixture(); inconsistent['AUDIT-HANDOFF.md'] = 'SEC-001';
  assert.equal(validateAuditArtifacts(inconsistent), false);
  const absentDefect = fixture(); absentDefect['SECURITY-FINDINGS.json'] = absentDefect['SECURITY-FINDINGS.json'].replaceAll(/quantity/gi, 'value').replace('totalCents', 'price');
  assert.equal(validateAuditArtifacts(absentDefect), false);
});
