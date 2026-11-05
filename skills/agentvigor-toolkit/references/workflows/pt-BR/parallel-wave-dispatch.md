# Ondas de tarefas em paralelo

Delegue trabalho independente com um escritor por arquivo e recurso.

1. Atribua ID, objetivo, arquivos permitidos, recursos mutáveis, dependências, checagens de aceite e responsável a cada tarefa.

2. Agrupe na mesma onda somente tarefas com arquivos distintos, recursos mutáveis isolados e sem dependência direta ou transitiva. Serialize o que estiver incerto.

3. Use ferramentas disponíveis no cliente. Preserve modelo e autenticação autorizados. O coordenador é dono dos arquivos compartilhados e operações Git. Revisores atuam em leitura.

4. Confira diffs parciais e a integração antes da próxima onda. Confirme a parada de um agente antes de assumir seus arquivos. Reatribua somente com tentativas limitadas e evidência nova.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/05-parallel-wave-dispatch.md).
