# Acesso a dados — Fases 2 e 3

## Estado e limites

A página técnica não usa Supabase. A Fase 3 adiciona login, guard, Proxy de renovação
e painel vazio; não há CRUD, conta provisionada nesta etapa ou Storage. O histórico
remoto consultado confirmou a migration de `admin_users` aplicada. A nova migration
de rate limiting tem dry-run conferido, mas aplicação pendente. O contrato da nova
RPC em `src/types/database.ts` é manual até a regeneração. A execução atual não
comprova pgTAP/reconstrução nem drift remoto. Ver [ADMIN_AUTH.md](ADMIN_AUTH.md).

## Clientes e ambiente

- `browser.ts`: somente URL e Publishable Key públicas; cookies via `@supabase/ssr`.
- `server.ts`: `server-only`, cliente por requisição, mesma chave pública e RLS.
  Cookies são somente leitura por padrão; Server Actions/Route Handlers
  optam por `writableCookies: true`. O Proxy renova sessão; `requireAdmin`
  autentica e autoriza cada entrada administrativa, além do layout.
- `privileged.ts`: `server-only`, Secret Key, sem persistência, refresh ou cookies.
  Ignora RLS: casos de uso precisam restringir explicitamente cada operação.
  Na Fase 3, o adaptador de rate limiting é o único consumidor e chama somente uma
  RPC fixa, autorizada para entrada pública de autenticação, sem acesso a usuários.
- Não criar um barrel que reexporte os três clientes. Componentes visuais não
  importam repositories nem módulos de ambiente privado.

As variáveis são validadas por Zod ao construir o cliente correspondente, antes
de qualquer I/O. Essa validação sob demanda é deliberada nesta etapa: o build e
a página técnica continuam funcionando sem credenciais; o primeiro uso sem
configuração falha informando apenas os nomes inválidos. Quando houver integração
ativa, a validação deverá ser chamada na inicialização desse runtime.
`DATABASE_URL` tem validador separado e não é necessária para o acesso pela Data API.

São aceitas as novas chaves `sb_publishable_` e `sb_secret_`. Não colocar JWT legado
`service_role` em variável pública. Projetos legados devem obter as novas chaves
no Dashboard; este código não tenta inferir privilégios de JWT não verificado.

## Convenções de repository e erros

Criar contratos por capacidade em `src/domain/<módulo>/` quando o caso de uso existir;
adaptadores em `src/infrastructure/repositories/`, marcados `server-only`.
Não introduzir CRUD genérico nem repository administrativo antes da Fase 3.
Contratos não dependem de Next.js ou Supabase. Injetar cliente de sessão no adaptador;
nunca cair automaticamente para cliente privilegiado após falha de permissão.

Usar `Database` como parâmetro do SDK; selecionar colunas explicitamente e mapear
linhas para DTOs reduzidos. Uma busca singular retorna `null` para ausência;
listas retornam `[]`; falhas geram `ApplicationError` com código estável.
`mapRepositoryError` descarta mensagens, hints e detalhes do PostgreSQL/PostgREST.
Erros desconhecidos viram dependência indisponível, sem retry automático.
Futuras bordas HTTP mapearão códigos para status e ID de correlação; não serializar
stack trace ou erro bruto do fornecedor.

## Migration e permissões

`20260923000000_create_admin_users.sql` cria somente a tabela de aplicação
`public.admin_users`; `auth.users` é mantida pelo Supabase.

- UUID `user_id`: PK e FK para `auth.users`, exclusão em cascata.
- `active`: obrigatório, padrão `false`; índice parcial permite no máximo uma ativa.
- Timestamps obrigatórios; trigger preserva criação e atualiza `updated_at`.
- RLS habilitada e forçada. `anon` não tem grants; `authenticated` tem só SELECT.
- Política `admin_users_select_own_active`: lê somente `auth.uid() = user_id AND active`.
  Usuário comum/inativo recebe zero linhas. Não há políticas de escrita.
- `service_role` tem SELECT/INSERT/UPDATE/DELETE para operações controladas futuras.
  A função de trigger tem `search_path` vazio e EXECUTE público revogado.

`supabase/tests/admin_users.test.sql` cobre grants, RLS, PK/FK, unicidade ativa,
null, autopromoção, exclusão e acesso privilegiado. Fixtures são revertidas ao fim.

## Desenvolvimento com Supabase Cloud, sem Docker

Usar um projeto Cloud exclusivo de desenvolvimento, sem dados reais e separado
de staging/produção. Não iniciar Supabase local. A CLI já é dependência versionada.
Depois de criar e vincular o projeto conforme a seção seguinte, executar:

```sh
npm run db:migrations:list
npm run db:push:dry-run
npm run db:push
npm run db:types
npm run db:types:check
npm run typecheck
npm test
```

Conferir o destino em `supabase/.temp/project-ref` e a única migration no dry-run
antes de aplicar. Não há scripts de start, stop ou reset. `config.toml` organiza
migrations e não provisiona nem altera configurações do Cloud.

Para testar sem Docker, executar o conteúdo completo de
`supabase/tests/admin_users.test.sql` no SQL Editor do projeto de desenvolvimento
vazio, como postgres. O teste prepara pgTAP e reverte todas as fixtures com ROLLBACK.
Conferir 16 asserções `ok`, sem `not ok`. Se houver erro/interrupção, garantir
ROLLBACK antes de reutilizar a sessão. Nunca executar fixtures com dados reais.
Para comprovar reconstrução, aplicar o histórico em outro projeto Cloud descartável
vazio e repetir os testes; depois restaurar o vínculo de desenvolvimento.
Não resetar o projeto remoto existente.

O gerador usa a Management API (`--project-id`) do projeto vinculado, sem Docker,
escreve UTF-8 somente após sucesso e permite verificar
drift com `--check`. A primeira geração substituirá o contrato provisório inteiro.
Revisar e versionar a saída; repetir após toda migration. Não afirmar ausência de
drift enquanto esse ciclo não tiver sido executado. O CI atual valida TypeScript e
testes unitários; testes de banco ainda dependem do projeto Cloud preparado.

## Passo manual necessário: criar e conectar desenvolvimento

Criar um projeto **de desenvolvimento**, por exemplo `portfolio-fotografa-dev`,
no [Dashboard Supabase](https://supabase.com/dashboard), separado de produção.
Guardar a senha do banco em um gerenciador de senhas. Usar banco sem dados reais
e confirmar PostgreSQL 17; alinhar `config.toml` caso o projeto use outra versão.

Copiar `.env.example` para `.env.local` na raiz e preencher:

| Variável | Onde obter | Classificação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Diálogo Connect do projeto | Pública |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API Keys → Publishable key | Pública |
| `SUPABASE_SECRET_KEY` | Settings → API Keys → Secret key | Secreta; só servidor |
| `DATABASE_URL` | Connect → conexão PostgreSQL; usar senha do banco e TLS | Secreta; ferramentas de banco |

Não enviar secrets pelo chat. Não reaproveitar chaves de produção. Staging e
produção deverão ter projetos e conjuntos de credenciais próprios. No deploy
futuro, cadastrar valores no ambiente do host, nunca em arquivo versionado.
Para `DATABASE_URL`, usar conexão direta se houver IPv6 ou Session Pooler para
IPv4, senha percent-encoded e TLS (`sslmode=require`). Não usar Transaction Pooler
para migrations. A URL é reservada para ferramentas de conexão direta; não é
necessária para a Data API nem para geração de tipos pela Management API.

Para vincular desenvolvimento, executar pessoalmente `npx supabase login` e
`npx supabase link --project-ref <REFERENCIA_DESENVOLVIMENTO>` no terminal da raiz.
A referência vem das configurações gerais do projeto e não é secreta. O token de
login é secreto e fica no armazenamento de credenciais da CLI, não em `.env.example`
nem no código. Informar a senha do banco no prompt da CLI; não colocá-la no histórico
do shell. `.env.local` é lido pelo Next.js, não automaticamente pela CLI.
A referência vinculada fica em `supabase/.temp/`, ignorada pelo Git. O token
pessoal de login da CLI é diferente da Secret Key do projeto.

Antes de aplicar: `npx supabase db push --linked --dry-run`. Revisar o destino e a
única migration; então aplicar com `npx supabase db push --linked`. Não executar
reset no remoto ou testes com fixtures em produção/staging. Não aplicar a migration
manualmente no SQL Editor: usar push para manter o histórico da CLI. A aplicação
remota e o provisionamento **não foram executados**. Não criar administrador nesta fase.

Referências: [clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[chaves](https://supabase.com/docs/guides/getting-started/api-keys),
[migrations](https://supabase.com/docs/guides/local-development/database-migrations)
e [tipos Cloud](https://supabase.com/docs/guides/api/rest/generating-types)
e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
