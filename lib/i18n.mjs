const messages = {
  usage: ['Usage', 'Uso', 'Uso'],
  commands: ['Commands', 'Comandos', 'Comandos'],
  options: ['Options', 'Opções', 'Opciones'],
  install: ['Install global AgentVigor skills', 'Instalar skills globais do AgentVigor', 'Instalar skills globales de AgentVigor'],
  doctor: ['Diagnose dependencies and configuration', 'Diagnosticar dependências e configuração', 'Diagnosticar dependencias y configuración'],
  status: ['Inspect managed skill files', 'Inspecionar arquivos de skills gerenciados', 'Inspeccionar archivos de skills gestionados'],
  monitor: ['Display local RTK statistics', 'Exibir estatísticas locais do RTK', 'Mostrar estadísticas locales de RTK'],
  update: ['Apply skills from this CLI version', 'Aplicar skills desta versão do CLI', 'Aplicar skills de esta versión del CLI'],
  benchmark: ['Compare paired benchmark observations', 'Comparar observações pareadas de benchmark', 'Comparar observaciones emparejadas de benchmark'],
  rollback: ['Restore the previous installation or remove all managed skills', 'Restaurar a instalação anterior ou remover todas as skills gerenciadas', 'Restaurar la instalación anterior o eliminar todas las skills gestionadas'],
  catalog: ['List or open an on-demand workflow', 'Listar ou abrir um fluxo sob demanda', 'Enumerar o abrir un flujo bajo demanda'],
  integrations: ['Inspect optional tools and their setup plans', 'Inspecionar ferramentas opcionais e planos de configuração', 'Inspeccionar herramientas opcionales y planes de configuración'],
  INTEGRATION_TOOL: ['Choose an integration listed in the help.', 'Escolha uma integração listada na ajuda.', 'Elige una integración de la ayuda.'],
  INTEGRATION_MODE: ['Choose status or plan.', 'Escolha status ou plan.', 'Elige status o plan.'],
  project: ['Plan, apply or reverse a project foundation', 'Planejar, aplicar ou reverter uma base de projeto', 'Planear, aplicar o revertir una base de proyecto'],
  quality: ['Execute configured project checks', 'Executar os checks configurados do projeto', 'Ejecutar las comprobaciones configuradas del proyecto'],
  harness: ['Evaluate the authorization exercise', 'Avaliar o exercício de autorização', 'Evaluar el ejercicio de autorización'],
  confirmProject: ['Apply the reviewed project changes? [y/N] ', 'Aplicar as mudanças de projeto revisadas? [s/N] ', '¿Aplicar los cambios revisados del proyecto? [s/N] '],
  confirmRun: ['Run the selected project code? [y/N] ', 'Executar o código selecionado do projeto? [s/N] ', '¿Ejecutar el código seleccionado del proyecto? [s/N] '],
  propose: ['Create proposal', 'Criar proposta', 'Crear propuesta'],
  keep: ['Keep', 'Preservar', 'Conservar'],
  passed: ['Passed', 'Aprovado', 'Aprobado'],
  failed: ['Failed', 'Falhou', 'Falló'],
  unavailable: ['Unavailable', 'Indisponível', 'No disponible'],
  applied: ['Applied', 'Aplicado', 'Aplicado'],
  inspected: ['Inspected', 'Inspecionado', 'Inspeccionado'],
  recovered: ['Recovered', 'Recuperado', 'Recuperado'],
  INVALID_PROJECT_MODE: ['Check the project mode and preset.', 'Confira o modo e o preset do projeto.', 'Revisa el modo y el perfil del proyecto.'],
  INVALID_PROJECT_PATH: ['Select an existing project directory.', 'Selecione uma pasta de projeto existente.', 'Selecciona un directorio de proyecto existente.'],
  INVALID_PROJECT_STATE: ['The project transaction state is invalid.', 'O estado da transação do projeto é inválido.', 'El estado de la transacción del proyecto no es válido.'],
  INVALID_TEMPLATE: ['Choose docs, eslint, harness or next.', 'Escolha docs, eslint, harness ou next.', 'Elige docs, eslint, harness o next.'],
  PROJECT_NOT_EMPTY: ['Use an empty directory for a new foundation.', 'Use uma pasta vazia para uma base nova.', 'Usa un directorio vacío para una base nueva.'],
  PROJECT_RECOVERY_REQUIRED: ['Preview and run project rollback to recover the interrupted transaction.', 'Revise a prévia e execute project rollback para recuperar a transação interrompida.', 'Revisa y ejecuta project rollback para recuperar la transacción interrumpida.'],
  CATALOG_ID: ['Unknown workflow. Run agentvigor catalog to see the IDs.', 'Fluxo desconhecido. Execute agentvigor catalog para listar os IDs.', 'Flujo desconocido. Ejecuta agentvigor catalog para ver los ID.'],
  CATALOG_MODE: ['Choose quick or full.', 'Escolha quick ou full.', 'Elige quick o full.'],
  PROJECT_PATH: ['Select an existing project directory.', 'Selecione uma pasta de projeto existente.', 'Selecciona un directorio de proyecto existente.'],
  QUALITY_CONFIG: ['Review the schema of agentvigor.quality.json.', 'Revise o formato de agentvigor.quality.json.', 'Revisa el formato de agentvigor.quality.json.'],
  QUALITY_MISSING: ['Create agentvigor.quality.json for this project.', 'Crie agentvigor.quality.json para este projeto.', 'Crea agentvigor.quality.json para este proyecto.'],
  HARNESS_MISSING: ['Use the disposable harness project preset first.', 'Use primeiro o preset de projeto descartável harness.', 'Usa primero el perfil de proyecto desechable harness.'],
  HARNESS_INPUT: ['Check the exercise files and project path.', 'Confira os arquivos do exercício e a pasta.', 'Revisa los archivos del ejercicio y el directorio.'],
  HARNESS_EXECUTION: ['The exercise could not be evaluated.', 'O exercício não pôde ser avaliado.', 'No se pudo evaluar el ejercicio.'],
  confirm: ['Apply these global changes? [y/N] ', 'Aplicar estas alterações globais? [s/N] ', '¿Aplicar estos cambios globales? [s/N] '],
  cancelled: ['Cancelled.', 'Operação cancelada.', 'Operación cancelada.'],
  thanks: ['Thank you for installing AgentVigor Toolkit.', 'Obrigado por instalar o AgentVigor Toolkit.', 'Gracias por instalar AgentVigor Toolkit.'],
  linkedin: ['Would you like to meet the creator on LinkedIn? [y/N] ', 'Você quer conhecer o criador no LinkedIn? [s/N] ', '¿Te gustaría conocer al creador en LinkedIn? [s/N] '],
  browser: ['Could not open the browser. Use the link below.', 'Não foi possível abrir o navegador. Use o link abaixo.', 'No se pudo abrir el navegador. Usa el enlace siguiente.'],
  telemetrySkipped: ['Installation complete. The optional event was not sent.', 'Instalação concluída. O evento opcional não foi enviado.', 'Instalación completa. El evento opcional no se envió.'],
  monitorUpdated: ['Updated at', 'Atualizado em', 'Actualizado a las'],
  monitorRetry: ['RTK refresh failed. A new attempt will follow.', 'A atualização do RTK falhou. Haverá nova tentativa.', 'Falló la actualización de RTK. Se volverá a intentar.'],
  planned: ['Plan preview', 'Prévia do plano', 'Vista previa del plan'],
  installed: ['Installed', 'Instalado', 'Instalado'],
  configured: ['Configured', 'Configurado', 'Configurado'],
  DUPLICATE_HOOKS: ['Duplicate RTK hook registrations require review.', 'Registros duplicados de hooks do RTK exigem revisão.', 'Los hooks duplicados de RTK necesitan revisión.'],
  unchanged: ['Up to date', 'Já está atualizado', 'Ya está actualizado'],
  'rolled-back': ['Rolled back', 'Reversão concluída', 'Reversión completada'],
  'not-installed': ['No managed skills', 'Sem skills gerenciadas', 'Sin skills gestionadas'],
  drifted: ['Managed files changed', 'Arquivos gerenciados alterados', 'Archivos gestionados modificados'],
  'recovery-required': ['Recovery required', 'Recuperação necessária', 'Recuperación necesaria'],
  add: ['Add', 'Adicionar', 'Añadir'],
  replace: ['Replace', 'Substituir', 'Reemplazar'],
  remove: ['Remove', 'Remover', 'Eliminar'],
  ok: ['OK', 'OK', 'OK'],
  missing: ['Missing', 'Ausente', 'Ausente'],
  modified: ['Modified', 'Modificado', 'Modificado'],
  invalid: ['Invalid', 'Inválido', 'Inválido'],
  unreadable: ['Unreadable', 'Ilegível', 'Ilegible'],
  duplicates: ['Duplicate hook entries', 'Entradas duplicadas de hooks', 'Entradas de hooks duplicadas'],
  partial: ['Partial check', 'Verificação parcial', 'Comprobación parcial'],
  tools: ['Executables and shims on PATH', 'Executáveis e shims no PATH', 'Ejecutables y lanzadores en PATH'],
  platform: ['Platform', 'Plataforma', 'Plataforma'],
  detected: ['Detected', 'Detectado', 'Detectado'],
  verifyDiscovery: ['Restart the agent and look for the installed skill in its command or skill selector.', 'Reinicie o agente e procure a skill instalada no seletor de comandos ou skills.', 'Reinicia el agente y busca la skill instalada en su selector de comandos o skills.'],
  pathHint: ['For a missing executable, check its official installer and reopen the terminal.', 'Se um executável estiver ausente, confira o instalador oficial e reabra o terminal.', 'Si falta un ejecutable, revisa su instalador oficial y vuelve a abrir la terminal.'],
  hooksHint: ['Review duplicate or unreadable hook entries in the relevant agent settings. Plugin, project, managed, and inline TOML hooks are outside this check.', 'Confira entradas duplicadas ou ilegíveis nas configurações do agente. Esta checagem cobre apenas os arquivos JSON globais, sem hooks de plugins, projetos, políticas ou TOML.', 'Revisa las entradas duplicadas o ilegibles en la configuración del agente. Esta comprobación solo cubre el JSON global y excluye plugins, proyectos, políticas y TOML.'],
  missingAgent: ['Selected agent was not found on PATH', 'O agente selecionado não foi encontrado no PATH', 'No se encontró el agente seleccionado en PATH'],
  rtkVersion: ['RTK version', 'Versão do RTK', 'Versión de RTK'],
  ERROR: ['Operation failed. Run agentvigor doctor for local checks.', 'A operação falhou. Execute agentvigor doctor para o diagnóstico local.', 'La operación falló. Ejecuta agentvigor doctor para el diagnóstico local.'],
  USAGE: ['Invalid arguments. See agentvigor --help.', 'Argumentos inválidos. Consulte agentvigor --help.', 'Argumentos inválidos. Consulta agentvigor --help.'],
  INVALID_PROFILE: ['Choose minimal, balanced or rigorous.', 'Escolha o perfil minimal, balanced ou rigorous.', 'Elige el perfil minimal, balanced o rigorous.'],
  INVALID_VERSION: ['The toolkit version is invalid.', 'A versão do toolkit é inválida.', 'La versión del toolkit no es válida.'],
  INVALID_AGENTS: ['Choose auto, codex, claude or both.', 'Escolha auto, codex, claude ou both.', 'Elige auto, codex, claude o both.'],
  INVALID_LANGUAGE: ['Choose en, pt-BR or es.', 'Escolha en, pt-BR ou es.', 'Elige en, pt-BR o es.'],
  INVALID_HOME: ['The home directory is invalid.', 'O diretório do usuário é inválido.', 'El directorio de usuario no es válido.'],
  INVALID_CLAUDE_CONFIG: ['CLAUDE_CONFIG_DIR must be a safe absolute path.', 'CLAUDE_CONFIG_DIR precisa ser um caminho absoluto seguro.', 'CLAUDE_CONFIG_DIR debe ser una ruta absoluta segura.'],
  NO_AGENTS: ['No supported agent on PATH. Choose an installed client with --agent.', 'Nenhum agente compatível no PATH. Selecione um cliente instalado com --agent.', 'No hay agentes compatibles en PATH. Selecciona un cliente instalado con --agent.'],
  CONFIRMATION_REQUIRED: ['Review --dry-run, then pass --yes to authorize noninteractive changes.', 'Revise a prévia com --dry-run. Depois, passe --yes para autorizar mudanças sem interação.', 'Revisa --dry-run y pasa --yes para autorizar cambios sin interacción.'],
  NOT_INSTALLED: ['Run install before update.', 'Execute install antes de update.', 'Ejecuta install antes de update.'],
  NO_ROLLBACK: ['No previous managed change to restore.', 'Nenhuma alteração gerenciada anterior para restaurar.', 'No hay cambios gestionados anteriores para restaurar.'],
  UNMANAGED_SKILL: ['An unmanaged skill already occupies a destination. Review it before retrying.', 'Uma skill externa já ocupa um destino. Revise o conflito antes de tentar novamente.', 'Una skill externa ya ocupa un destino. Revisa el conflicto antes de volver a intentar.'],
  SKILL_DRIFT: ['A managed file differs from its backup. Save your copy before restoring the expected content.', 'Um arquivo gerenciado difere do backup. Guarde sua cópia antes de restaurar o conteúdo esperado.', 'Un archivo gestionado difiere de su copia. Guarda tu versión antes de restaurar el contenido esperado.'],
  UNSAFE_PATH: ['A path could not be verified as safe. Check for links and permissions.', 'Não foi possível validar a segurança de um caminho. Confira links e permissões.', 'No se pudo verificar una ruta segura. Comprueba enlaces y permisos.'],
  INVALID_STATE: ['Managed state is invalid. Preserve it before attempting recovery.', 'O estado gerenciado é inválido. Preserve os arquivos antes de tentar recuperar.', 'El estado gestionado no es válido. Consérvalo antes de intentar recuperarlo.'],
  ROOT_CHANGED: ['Restore the configuration directory used at installation before retrying.', 'Restaure o diretório de configuração usado na instalação antes de tentar novamente.', 'Restaura el directorio de configuración usado al instalar antes de reintentar.'],
  PLAN_CHANGED: ['Managed state changed after the preview. Review the new plan and confirm again.', 'O estado gerenciado mudou após a prévia. Revise o novo plano e confirme novamente.', 'El estado gestionado cambió después de la vista previa. Revisa el nuevo plan y confirma otra vez.'],
  BUNDLE_ERROR: ['The bundled skill files are missing or invalid. Reinstall from a verified package.', 'Os arquivos de skills do pacote estão ausentes ou inválidos. Reinstale a partir de um pacote verificado.', 'Los archivos de skills del paquete faltan o no son válidos. Reinstala desde un paquete verificado.'],
  LOCKED: ['Another installation or recovery holds the lock. See the recovery guide.', 'Outra instalação ou recuperação mantém o bloqueio. Consulte o guia de recuperação.', 'Otra instalación o recuperación mantiene el bloqueo. Consulta la guía de recuperación.'],
  RECOVERY_REQUIRED: ['An interrupted transaction needs recovery. See the recovery guide.', 'Uma transação interrompida exige recuperação. Consulte o guia de recuperação.', 'Una transacción interrumpida necesita recuperación. Consulta la guía de recuperación.'],
  FILESYSTEM_ERROR: ['Could not access the managed files. Check permissions and free space.', 'Não foi possível acessar os arquivos gerenciados. Confira permissões e espaço livre.', 'No se pudo acceder a los archivos gestionados. Comprueba los permisos y el espacio libre.'],
  RTK_MISSING: ['RTK is missing or has no executable on PATH. See the integration guide.', 'RTK está ausente ou sem executável no PATH. Consulte o guia de integrações.', 'RTK falta o no tiene ejecutable en PATH. Consulta la guía de integraciones.'],
  RTK_UNRECOGNIZED: ['The executable did not report supported RTK gain options.', 'O executável não apresentou opções compatíveis de rtk gain.', 'El ejecutable no mostró opciones compatibles de rtk gain.'],
  RTK_FAILED: ['rtk gain returned an error.', 'rtk gain retornou um erro.', 'rtk gain devolvió un error.'],
  MONITOR_INTERVAL: ['Interval must be an integer from 1 to 3600 seconds.', 'O intervalo deve ser um inteiro entre 1 e 3600 segundos.', 'El intervalo debe ser un entero entre 1 y 3600 segundos.'],
  PROCESS_TIMEOUT: ['The executable exceeded its time limit.', 'O executável excedeu o limite de tempo.', 'El ejecutable superó su límite de tiempo.'],
  PROCESS_OUTPUT_LIMIT: ['The executable exceeded its output limit.', 'O executável excedeu o limite de saída.', 'El ejecutable superó su límite de salida.'],
  PROCESS_START: ['Could not start the executable.', 'Não foi possível iniciar o executável.', 'No se pudo iniciar el ejecutable.'],
  BENCHMARK_INPUT: ['Invalid paired benchmark file. See the benchmark guide and schema.', 'Arquivo de benchmark pareado inválido. Consulte o guia e o esquema.', 'Archivo de benchmark emparejado inválido. Consulta la guía y el esquema.'],
  UNSUPPORTED_NODE: ['Use a current patch of Node.js 22, 24 or 26.', 'Use uma atualização recente do Node.js 22, 24 ou 26.', 'Usa una actualización reciente de Node.js 22, 24 o 26.'],
};

const languages = ['en', 'pt-BR', 'es'];

function locale(value) {
  const base = value?.toLowerCase().split(/[-_.@]/)[0];
  return { en: 'en', pt: 'pt-BR', es: 'es' }[base];
}

export function language(env = process.env) {
  const configured = [env.AGENTVIGOR_LANG, env.LC_ALL, env.LC_MESSAGES, env.LANG].find(Boolean);
  return locale(configured ?? Intl.DateTimeFormat().resolvedOptions().locale) ?? 'en';
}

export function translator(lang) {
  const index = languages.indexOf(lang);
  if (index < 0) throw Object.assign(new Error('INVALID_LANGUAGE'), { code: 'INVALID_LANGUAGE' });
  return (key, value) => {
    const message = Object.hasOwn(messages, key) ? messages[key][index] : undefined;
    return [message ?? key, value].filter(part => part !== undefined).join(' ');
  };
}

export function errorMessage(t, code) {
  return t(Object.hasOwn(messages, code) ? code : 'ERROR');
}
