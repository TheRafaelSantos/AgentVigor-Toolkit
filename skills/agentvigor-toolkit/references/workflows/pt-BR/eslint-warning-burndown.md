# Redução de avisos do ESLint

Meça os avisos por regra e reduza-os sem esconder regressões.

1. Localize o comando e o escopo do ESLint existente. Execute-o com segurança, com saída integral, e conte avisos por regra e arquivo.

2. Identifique os casos caros ou sensíveis ao comportamento. Apresente evidências e escolha entre corrigir, registrar exceção restrita ou alterar a regra dentro da autorização vigente. Decisões pendentes permitem trabalho independente.

3. Preserve severidades, exclusões, testes e comportamento existentes. Agrupe por causa e isole arquivos e recursos se delegar. Repita lint e regressões pertinentes após cada grupo.

4. Reporte as contagens finais observadas, justificativas de supressão, exceções e mudanças separadas de configuração.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/02-eslint-warning-burndown.md).
