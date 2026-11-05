# Revisão de segurança em leitura

Rastreie fronteiras de confiança em um snapshot ou diff definido.

1. Registre alvo, commit ou base/head e modo de comparação, camadas Git, autorização, exclusões e destino privado do relatório. Preserve árvore de trabalho e índice.

2. Identifique entradas, capacidades do atacante, ativos, papéis e operações sensíveis. Siga entradas externas através de validação, autorização e armazenamento. Leia chamadores e busque contraevidência.

3. Use ferramentas existentes quando adequadas. Inspecione scripts antes de qualquer teste isolado. Use dados sintéticos e nenhuma credencial de produção. Mantenha artefatos privados no destino autorizado.

4. Reporte achados confirmados ou hipóteses com severidade, confiança, localização, pré-requisitos, impacto, evidência redigida e verificação focada. Separe escopo não revisado, evidência estática e execução.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/13-security-review.md).
