# Auditoria de segurança e remediação

Audite sistemas selecionados explicitamente e prepare lotes de correção verificáveis.

1. Escolha AUDIT, PLAN, FIX ou VERIFY. Use AUDIT em leitura por padrão. Registre escopo, revisão imutável, exclusões, fronteiras, permissões e destino privado. Correções e testes ativos exigem escopo próprio.

2. Rastreie entradas aplicáveis e inventarie dependências, runtime, CI, infraestrutura, privilégios e tratamento de segredos. Confira padrões e avisos atuais diante das versões resolvidas e código alcançável. Registre áreas não revisadas.

3. Separe achados confirmados, hipóteses, endurecimento e status de suporte. Para cada item indique ID estável, severidade, confiança, gatilho, alcance, impacto, evidência redigida, contraevidência, correção mínima e verificação.

4. Gere em privado SECURITY-AUDIT.md, SECURITY-FINDINGS.json, REMEDIATION-PROMPTS.md e AUDIT-HANDOFF.md. Use versão de schema e escopo, registre próximo lote, verifique a revisão ao retomar e repita checagens negativas e de uso legítimo para correções selecionadas.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/16-security-audit.md).
