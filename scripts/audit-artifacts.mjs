// This verifier is specific to the synthetic native audit fixture.
export function validateAuditArtifacts(artifacts) {
  try {
    const names = ['SECURITY-AUDIT.md', 'SECURITY-FINDINGS.json', 'REMEDIATION-PROMPTS.md', 'AUDIT-HANDOFF.md'];
    if (!names.every(name => typeof artifacts[name] === 'string' && artifacts[name].trim())) return false;
    const data = JSON.parse(artifacts['SECURITY-FINDINGS.json']);
    if (data.schemaVersion !== 1 || !Array.isArray(data.findings) || data.findings.length < 2) return false;
    const ids = data.findings.map(finding => finding.id);
    if (!ids.every(id => typeof id === 'string' && /^[A-Z][A-Z0-9_-]*\d$/.test(id)) || new Set(ids).size !== ids.length) return false;
    if (!data.findings.every(finding => ['title', 'severity', 'confidence', 'evidence'].every(key =>
      finding[key] !== undefined && JSON.stringify(finding[key]).length > 2))) return false;
    if (!names.filter(name => name.endsWith('.md')).every(name => ids.every(id => artifacts[name].includes(id)))) return false;
    const findings = data.findings.map(finding => JSON.stringify(finding));
    return findings.some(text => /tenant/i.test(text)) && findings.some(text => /quantity|quantidade/i.test(text));
  } catch { return false; }
}
