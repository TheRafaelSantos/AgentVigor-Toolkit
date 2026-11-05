# Optional Next.js and PostgreSQL preset

`next-postgres` initializes a new empty project with the existing Next.js
foundation plus the complete Vibe PostgreSQL template. `next` remains the
foundation without a database selection. The preset copies the upstream
Zod environment validation, Pino redaction, lazy Drizzle/pg connection pool,
schema placeholder, class-name utility, Vitest config and tests. The MIT notice
for Matheus Gomes is copied to `.agentvigor-quality/LICENSE-MIT.txt`.

Run the following from the AgentVigor checkout in PowerShell. Choose a new
directory for the application. The preview and initialization work offline.

```powershell
$projectPath = New-Item -ItemType Directory -Path './my-next-postgres-app'
node bin/agentvigor.mjs project --mode init --template next-postgres --path $projectPath.FullName --dry-run
node bin/agentvigor.mjs project --mode init --template next-postgres --path $projectPath.FullName
Set-Location $projectPath.FullName
npm.cmd install --ignore-scripts
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Dependency installation requires access to npm. After it finishes, lint, type
checking, unit tests and build work without a PostgreSQL credential. Tests check
environment validation, log redaction and pool lifecycle with synthetic inputs.
The initial schema is empty. Define the application's schema before using
`npm run db:generate` to produce versioned SQL. Review the SQL and use a selected
database with explicit authorization before running `npm run db:migrate`.
Connection settings belong in ignored `.env.local`, following `.env.example`.
This preset does not provision a database or alter any existing database.

For rollback, return to the AgentVigor checkout and preview `node bin/agentvigor.mjs
project --mode rollback --path <project-directory> --dry-run` before repeating it
without `--dry-run`. Rollback removes untouched managed files. Keep or back up
user edits, generated migrations, installed dependencies and local configuration.
These files are outside the preset's ownership.

## Validation record

On Windows with Node 24.15.0, the generated fixture passed lint, TypeScript,
the Node title test, eight original Vitest tests and the production build.
Drizzle generated a `CREATE TABLE` migration for a synthetic one-column schema
without a connection URL. Docker's Linux engine was unavailable, so applying
migrations against a running PostgreSQL instance remains pending.

The first build exceeded the 180-second quality limit. With Tailwind's source
base set explicitly to `src`, Turbopack compiled in 8.6 seconds and the complete
build passed. Both Next presets now emit
`@import "tailwindcss" source("../");` in `src/app/globals.css`. Register
additional source directories explicitly if the application later places UI
components outside `src`. See the [Tailwind source detection documentation](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path).

## Português brasileiro

No PowerShell, abra a pasta do AgentVigor e execute o bloco acima. A prévia mostra
os arquivos que serão criados. Confirme a inicialização só depois de verificar o
destino. Escolha `next` quando ainda não tiver decidido usar PostgreSQL. O
`next-postgres` copia os módulos e testes do Vibe com crédito a Matheus Gomes.

A inicialização funciona offline. `npm.cmd install` requer acesso ao npm.
Lint, tipos, testes e build devem rodar sem credenciais. O schema começa vazio.
Depois de definir as tabelas, gere o SQL com `npm.cmd run db:generate`, revise-o
e só execute `db:migrate` em um banco escolhido e autorizado. Configure os valores
privados em `.env.local`, seguindo `.env.example`.

Para desfazer, volte ao checkout do AgentVigor e use `project --mode rollback`
com `--path` apontando para o projeto. Rode primeiro com `--dry-run`. A reversão
remove os arquivos gerenciados intactos e preserva arquivos fora do preset.

Na validação Windows, lint, tipos, os nove testes e o build passaram. Também foi
gerado SQL de uma tabela sintética sem URL de conexão. A aplicação da migração
em PostgreSQL real segue pendente porque o daemon do Docker estava indisponível.
A busca de classes do Tailwind fica limitada a `src`. Se criar componentes fora
dessa pasta, registre as fontes adicionais no CSS.

## Español

Abre PowerShell en el checkout de AgentVigor y ejecuta el bloque anterior.
Revisa el destino en la vista previa y confirma la inicialización. Elige `next`
si aún no has seleccionado PostgreSQL. `next-postgres` copia los módulos y
pruebas originales de Vibe con atribución a Matheus Gomes.

La inicialización funciona sin conexión. `npm.cmd install` necesita acceso a
npm. Lint, tipos, pruebas y compilación se ejecutan sin credenciales. El esquema
empieza vacío. Tras definir las tablas, genera SQL con `npm.cmd run db:generate`
y revísalo antes de usar `db:migrate` en una base seleccionada y autorizada.
Guarda los valores privados en `.env.local` siguiendo `.env.example`.

Para revertir, vuelve al checkout y usa `project --mode rollback` con `--path`
apuntando al proyecto. Ejecuta primero con `--dry-run`. Se eliminan los archivos
gestionados intactos y se conservan los archivos fuera del preset.

En Windows pasaron lint, tipos, nueve pruebas y compilación. También se generó
SQL para una tabla sintética sin URL de conexión. Aplicar la migración en un
PostgreSQL real sigue pendiente porque el daemon Docker estaba indisponible.
Tailwind busca clases en `src`. Registra fuentes adicionales si los componentes
se ubican fuera de esa carpeta.
