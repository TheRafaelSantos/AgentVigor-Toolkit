# Preparação do ambiente de desenvolvimento

Inventarie a máquina real e planeje somente alterações globais selecionadas.

1. Identifique SO, arquitetura, shell, Windows ou WSL, runtime, gerenciador e executáveis dos agentes. Rode `agentvigor doctor` para evidência local. Confira origem e versão de cada componente selecionado.

2. Liste somente os clientes e ferramentas escolhidos. Registre escopo, versões, ação, evidência, instalador e reversão. Preserve autenticação, aprovações e sandbox atuais. Docker, plugins, RTK, MCP e Caveman são escolhas separadas.

3. Para as skills do AgentVigor simule `agentvigor install --agent codex --dry-run`, trocando para `claude` ou `both` somente se selecionados. Confira a saída e confirme a instalação correspondente quando autorizada. Para outras ferramentas escolhidas, use o método oficial verificado após autorização específica e backup.

4. Em novo terminal e sessão, confira versões, descoberta de skills e testes autorizados de integração. Registre instalado, configurado, validado, pendente ou pulado separadamente. Remova caminhos privados e credenciais do relatório compartilhável.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/10-development-environment-setup.md).
