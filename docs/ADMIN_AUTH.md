# Fase 3 — Acesso administrativo

## Revisão final — 23/09/2026 (estado atual)

Esta seção prevalece sobre os registros históricos abaixo, que descrevem etapas
anteriores ao provisionamento e à homologação. O administrador DEV já existe;
não repetir as instruções históricas de criação de conta. Nenhum usuário foi
criado ou alterado nesta revisão. Nenhuma funcionalidade da Fase 4 foi implementada.

### Homologação manual informada pelo responsável

- Login com usuário real do Supabase Auth.
- Validação do vínculo ativo em `public.admin_users` e acesso a `/admin`.
- Logout e redirecionamento para login ao acessar `/admin` sem sessão.
- Recuperação de senha e recebimento real do e-mail do Supabase.
- Callback PKCE, definição de nova senha e novo acesso ao painel.

Esses resultados foram relatados pelo responsável, não repetidos automaticamente
nesta revisão. Nenhuma identidade, credencial ou URL de recuperação é registrada.
As menções históricas abaixo a E2E principal pendente estão superadas por esse relato.

### Feedback da recuperação

`recoverAction` já retornava a mensagem genérica e `useActionState` a renderizava.
A limpeza do input não controlado após a Action é comportamento do
[React](https://react.dev/reference/react-dom/components/form), não evidência de
falha no envio. O problema de UX identificado foi o feedback discreto, sem destaque
nem foco após a resposta.

`AuthForm` agora destaca a resposta de recuperação com borda, fundo e contraste,
mostra “Solicitação recebida” no sucesso e direciona o foco para o feedback após
a resposta. Mantém `role="status"`, região viva e anúncio atômico. A mensagem
continua no estado, independentemente da limpeza do campo, até nova resposta ou
navegação. Servidor e texto genérico permanecem inalterados:

> Se o e-mail estiver cadastrado, você receberá um link. Abra-o neste mesmo navegador.

Não há consulta de existência do e-mail em `admin_users`. A confirmação visual e
do foco no navegador após este ajuste ainda está pendente; nenhum e-mail foi
enviado nesta revisão para repetir o fluxo real.

### Segurança e testes revisados

Foram revisados login, recuperação, callback, redefinição, painel, logout, API de
sessão e Server Actions. Permanecem os guards independentes no servidor,
`getUser()` e vínculo ativo via RLS, Origin exato nas mutações, destinos restritos,
PKCE pelo SDK, rate limiting, respostas sanitizadas e headers privados.
Não foi identificada necessidade de alterar ou enfraquecer essas proteções.

A suíte pendente `admin_users.test.sql` contém 16 asserções sobre RLS/grants, FK,
PK, unicidade de administrador ativo, `NOT NULL`, leitura por perfil, bloqueio de
autopromoção/escrita, acesso privilegiado e exclusão em cascata. Abre transação,
cria pgTAP se necessário, insere três fixtures em `auth.users` e duas em
`public.admin_users`, tenta inserts/updates/deletes, exclui uma fixture de Auth
para testar cascade e termina com `ROLLBACK`.

**Essa suíte não foi executada.** Ela escreve nas tabelas reais, mesmo com rollback;
a fixture ativa conflita com o administrador existente e as contagens pressupõem
banco vazio. Executar apenas em banco descartável sem dados reais, com autorização
para criar fixtures. Não desativar ou excluir o administrador real para fazê-la passar.

O resultado anterior de `auth_rate_limits.test.sql` é 18/18, com armazenamento
temporário, transação e rollback; não foi reexecutado. Esse resultado não comprova
concorrência nem execução da RPC real sob `service_role`.

### Checks desta revisão

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: 71 testes em 12 arquivos aprovados, usando SDK/banco simulados.
- `npm.cmd run build`: aprovado.
- `npm.cmd run db:types:check`: aprovado, sem regenerar arquivo.
- `npm.cmd run db:migrations:list`: `20260923000000` e `20260923010000`
  alinhadas local/remoto.
- `npm.cmd run db:push:dry-run`: `upToDate: true`, sem migrations, seeds ou roles
  pendentes. Nenhuma migration aplicada.
- `npm.cmd run check:secrets`: 77 arquivos de fonte e 15 artefatos cliente
  verificados, sem ocorrências; valores não impressos.
- `.env.local` ignorado e não rastreado; somente `.env.example` versionado.
- `git diff --check`: aprovado, com avisos de normalização LF/CRLF no Windows.

A CLI precisou de execução fora do sandbox por bloqueio do arquivo local de
telemetria. Não foram executadas suítes SQL nem alterações de dados reais.
`.env.local` não foi alterado; nenhum commit ou push realizado.

Pendências: pgTAP de `admin_users` em ambiente descartável autorizado e confirmação
visual do feedback ajustado. Cenários reais negativos (link expirado/reutilizado,
outro navegador, refresh inválido, usuário inativo/sem vínculo) não constam da
homologação manual informada; há testes simulados para parte dessas fronteiras.
Não modificar a conta real para testá-los sem autorização. O fluxo principal DEV
está homologado; não declarar essas verificações pendentes como concluídas.

Arquivos alterados por esta revisão: `src/features/auth/components/auth-form.tsx`
e `docs/ADMIN_AUTH.md`. As demais mudanças no Git já existiam no início.

## Registro histórico da implementação inicial

Implementação limitada à autenticação. Sem cadastro público, contas de clientes,
CRUD, galerias, portfólio, upload ou download. Nenhuma conta foi provisionada.

## Fluxo e fronteiras

- `/auth/login`: Server Action valida entrada/Origin, consome rate limiting,
  autentica com e-mail/senha, chama `getUser()` e consulta `admin_users.active`
  usando o cliente da sessão e RLS. Falha de autorização encerra a sessão recém-criada.
- `/admin`: layout e página verificam sessão e autorização no servidor. Painel vazio.
- `/api/admin/session`: Route Handler verifica independentemente e retorna apenas
  `{ authorized: true }`, ou 401/403/503 sanitizado com identificador de correlação.
- Logout por POST encerra a sessão deste navegador, inclusive se a conta ficou
  inativa. Não exige autorização administrativa porque apenas remove acesso.
- `/auth/forgot-password`: mensagem uniforme para e-mails existentes/inexistentes;
  `resetPasswordForEmail` inicia PKCE. O link deve ser aberto no mesmo navegador.
- `/auth/callback`: troca código pelo SDK, exige administradora ativa e redireciona
  apenas a `/auth/reset-password`. Código expirado, reutilizado ou sem verifier falha.
- Redefinição/alteração de senha valida novamente a administradora ativa, exige
  12–128 caracteres e confirmação, aplica limite e encerra sessões com `scope: global`.
  Uma sessão administrativa normal também pode alterar a senha; não existe flag de
  recuperação confiada ao browser. JWTs já emitidos podem permanecer válidos até
  sua expiração no provedor; desativar `admin_users.active` bloqueia imediatamente
  novas operações da aplicação, independentemente desse prazo.
- O Proxy renova cookies na requisição SSR **e** resposta e preserva cookies em
  redirects. Não substitui os guards de páginas, Actions e handlers. Não há cache
  compartilhado de sessão nem uso de `getSession()` como prova de identidade.
- Redirect após login aceita somente `/admin`; callback usa destino fixo e origem
  configurada, nunca Host/`next` externo. Mutações exigem Origin exato, além da
  proteção nativa de Server Actions. Login/recuperação são necessariamente públicos.
- Headers privados: `no-store`, `noindex, nofollow, noarchive`, `no-referrer`.
  Rotas privadas usam renderização dinâmica; não incluir em sitemap.
- Futuras operações devem chamar `requireAdmin` no próprio caso de uso/entrada;
  estar sob o layout `/admin` não é suficiente. Não há APIs administrativas extras.

## Rate limiting

Migration `20260923010000_auth_rate_limits.sql`: janela atômica no PostgreSQL de
15 minutos, 10 tentativas por identificador/operação (3 para recuperação) e 60
globais por operação. Callback usa um identificador fixo adicional. Identificadores
são HMAC-SHA256; não persistir e-mail, IP, senha ou token. Limite global impede que
endereços aleatórios contornem a proteção sem confiar em cabeçalhos de IP.
Um atacante pode consumir o limite e causar indisponibilidade temporária; o valor
é conservador para uma única administradora. Não há reset de contador por login.

A função é `SECURITY DEFINER`, `search_path` vazio, argumentos restritos e EXECUTE
somente para `service_role`; tabela com RLS forçada e sem grants para clientes ou
service_role. O único uso privilegiado pré-login é essa RPC fixa; não permite
consultar usuários nem dados administrativos. Falha do banco bloqueia a operação.
Registros de janelas com mais de 24 horas são removidos na próxima tentativa;
sem tráfego, permanecem até a próxima limpeza. Não há cron provisionado.

Os limites nativos do Supabase Auth também devem permanecer ativos: a API do
Supabase é diretamente acessível com a Publishable Key e não passa pelo limitador
do Next.js. Configurar os limites do provedor antes de liberar o acesso.

## Configuração antes do primeiro uso

1. Conferir o projeto Cloud de **desenvolvimento** vinculado e o dry-run. A migration
   de `admin_users` já consta no histórico remoto consultado nesta etapa. A migration
   de rate limiting foi preparada e seu dry-run conferido; aplicação remota pendente.
   Executar `npm run db:push`, seguido de `npm run db:types` e `npm run db:types:check`.
   O contrato da nova RPC em `database.ts` é manual até essa regeneração.
2. No `.env.local` ignorado, manter URL/Publishable Key/Secret Key existentes e definir:
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000` no desenvolvimento (ou a porta usada).
   - `AUTH_RATE_LIMIT_SECRET`: valor aleatório com pelo menos 32 caracteres,
     gerado localmente com um gerenciador de secrets. Não compartilhar no chat.
   Em produção, origem HTTPS exata e secrets exclusivos do ambiente.
   O teste HTTP desta implementação usou valores efêmeros no processo, sem editar `.env.local`.
3. Supabase Dashboard → Authentication → configuração de cadastro: desativar
   **Allow new users to sign up** e **Anonymous sign-ins**. Manter apenas e-mail/senha;
   nenhum OAuth/telefone é necessário. A ausência de formulário de cadastro não
   desabilita a API de signup: essa configuração remota é obrigatória.
4. Authentication → URL Configuration: Site URL igual à origem acima; Redirect URLs
   com o endereço **exato** `http://localhost:3000/auth/callback` (ajustar porta).
   Para outro ambiente, cadastrar sua URL HTTPS exata, sem wildcard de domínio.
5. Authentication → Email Templates → Reset Password: manter o link de verificação
   do Supabase usando `{{ .ConfirmationURL }}`. Não trocar por link direto à página
   de senha; o SDK precisa receber o código PKCE. Configurar SMTP confiável e remetente
   autorizado; o serviço de e-mail padrão tem restrições de destinatários/volume.
6. Authentication → Rate Limits: revisar/manter limites de login e recuperação;
   configurar política mínima de senha de 12 caracteres. Revisar proteção de senhas
   vazadas conforme disponibilidade. O código não altera configurações remotas.

## Conta real: parar e obter confirmação antes de executar

**O que:** exatamente um usuário de e-mail/senha em `auth.users` e uma linha ativa
em `public.admin_users`. Nenhum cliente tem conta.

**Onde e método:** no projeto Supabase correto, Dashboard → Authentication → Users
→ Add user/Create new user. Criação pelo Dashboard, não pela aplicação, CLI ou script
automático. Informar senha forte diretamente no Dashboard, guardada em gerenciador.
Confirmar o e-mail somente após verificar que a caixa pertence à fotógrafa.

**E-mail:** usar o endereço profissional controlado exclusivamente pela fotógrafa,
com acesso à caixa para recuperação. **O endereço exato ainda não foi informado**;
não presumir o e-mail do proprietário do projeto nem usar um endereço fictício.
Em desenvolvimento, preferir caixa de teste controlada; não reutilizar senha de produção.

**Vínculo:** copiar o UUID exibido em Authentication → Users, conferir e-mail/UUID e,
após confirmação, executar no SQL Editor como operador autorizado:

```sql
begin;
-- Substituir pelo UUID conferido; nunca executar o placeholder.
insert into public.admin_users (user_id, active)
values ('UUID_CONFIRMADO_DA_FOTOGRAFA'::uuid, true);
commit;
```

Não fazer upsert nem desativar outra administradora automaticamente. A FK exige
usuário existente e o índice permite somente uma administradora ativa. Falha de
unicidade exige investigar o vínculo existente. Conferir o resultado com SELECT
de `user_id, active`; não consultar ou copiar dados de senha.

**Riscos:** vincular UUID/e-mail incorreto concede acesso administrativo à pessoa
errada; escolher projeto errado mistura ambientes; auto-confirmar e-mail sem validar
titularidade permite recuperação pela pessoa errada; segredo/senha compartilhado
compromete a conta; signup habilitado permite contas extras no Auth (a RLS/guard ainda
negam o painel). E-mails de recuperação contêm credenciais temporárias. Não registrar
URLs de callback com código em logs da infraestrutura; usar HTTPS fora de localhost.

Esta operação **não foi executada**. A parada é uma exigência explícita do usuário.

## Verificações e pendências

Comandos locais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
`npm run check:secrets`. O último confere arquivos versionáveis e `.next/static`
contra secrets locais sem imprimir valores, além de padrões de Secret Key.
Não é uma prova exaustiva contra toda forma de segredo possível.

Com o servidor iniciado e ambiente configurado, `npm run test:auth:smoke` verifica
login/recuperação públicos, bloqueio de `/admin`, API e redefinição sem sessão,
callback sem código, cookie falso e headers. `AUTH_SMOKE_ORIGIN` permite outra porta
local. Esse smoke não cria contas nem envia e-mails e não substitui E2E autenticado.

Testes unitários/de fronteira simulam SDK e banco: autorização, desativação, dados
forjados, chamadas diretas de API/Actions, CSRF, callbacks PKCE inválidos, allowlist,
rate limiting, logout, recuperação e cookies do Proxy. SQL pgTAP para grants/RLS,
janelas/limites/limpeza está em `supabase/tests/auth_rate_limits.test.sql` (12 testes).
Executar apenas em banco descartável sem dados reais; ele limpa buckets dentro de
uma transação revertida. A suíte anterior de `admin_users` também deve passar.

Depois do provisionamento confirmado, validar no ambiente isolado:

1. Login correto → painel; senha incorreta → mensagem genérica; logout → painel bloqueado.
2. Recuperação → e-mail recebido → mesmo navegador → senha nova → login novamente;
   repetir link, usar outro navegador e expirar link devem falhar.
3. Expirar access token com refresh válido → SSR renova cookies; refresh inválido → login.
4. Desativar a linha administrativa com sessão aberta → página, API e Action negadas;
   reativar somente a conta previamente confirmada após o teste.
5. Usuário de teste sem vínculo/inativo não acessa painel nem troca senha; usar apenas
   fixtures autorizadas, não criar contas de clientes nem uma segunda administradora.
6. Conferir mobile/desktop, teclado, foco, loading/erros e ausência de conteúdo privado
   após logout. Revisão visual pendente: nenhum navegador conectado disponível na sessão.

Não declarar a Fase 3 homologada até executar SQL e E2E real. Nenhuma fase posterior
foi iniciada e nenhum commit foi criado.

Referências consultadas: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[senha e recuperação](https://supabase.com/docs/guides/auth/passwords),
[limites Auth](https://supabase.com/docs/guides/auth/rate-limits) e
[autorização Next.js](https://nextjs.org/docs/app/guides/authentication).

## Resultado local desta execução

- Branch confirmada: `fase-3-autenticacao`; nenhuma alteração preexistente no início.
- Lint, typecheck e build de produção: aprovados.
- Vitest: 71 testes aprovados em 12 arquivos (inclui testes anteriores).
- Smoke HTTP contra build de produção: 7 verificações aprovadas, sem conta real.
- Secrets: 77 arquivos de fonte/versionáveis e 15 artefatos de cliente verificados;
  nenhum secret local encontrado. `.env.local` permaneceu ignorado e inalterado.
- `git diff --check`: sem erros; somente avisos de conversão LF/CRLF do Git no Windows.
- Histórico de migrations e dry-run: consultados; nenhuma mutation remota executada.
- pgTAP, E2E com administradora e revisão visual: pendentes, conforme seção anterior.
- Dependências adicionadas: nenhuma; lockfile inalterado. Sem commit.

## Inventário de arquivos

Criados:

```text
docs/ADMIN_AUTH.md
scripts/check-secrets.mjs
scripts/smoke-auth.mjs
src/app/(admin)/admin/error.tsx
src/app/(admin)/admin/layout.tsx
src/app/(admin)/admin/loading.tsx
src/app/(admin)/admin/page.tsx
src/app/(auth)/auth/callback/route.test.ts
src/app/(auth)/auth/callback/route.ts
src/app/(auth)/auth/error.tsx
src/app/(auth)/auth/forgot-password/page.tsx
src/app/(auth)/auth/layout.tsx
src/app/(auth)/auth/loading.tsx
src/app/(auth)/auth/login/page.tsx
src/app/(auth)/auth/reset-password/page.tsx
src/app/api/admin/session/route.test.ts
src/app/api/admin/session/route.ts
src/application/auth/actions.test.ts
src/application/auth/actions.ts
src/application/auth/authorize-admin.test.ts
src/application/auth/authorize-admin.ts
src/application/auth/http.ts
src/application/auth/request-security.test.ts
src/application/auth/request-security.ts
src/application/auth/session.ts
src/config/auth.server.ts
src/domain/auth/admin.ts
src/features/auth/components/auth-error.tsx
src/features/auth/components/auth-form.tsx
src/features/auth/schemas.test.ts
src/features/auth/schemas.ts
src/infrastructure/repositories/admin-access.test.ts
src/infrastructure/repositories/admin-access.ts
src/infrastructure/supabase/auth-rate-limit.test.ts
src/infrastructure/supabase/auth-rate-limit.ts
src/proxy.test.ts
src/proxy.ts
supabase/migrations/20260923010000_auth_rate_limits.sql
supabase/tests/auth_rate_limits.test.sql
```

Alterados: `.env.example`, `package.json`, `src/types/database.ts`,
`docs/ARCHITECTURE.md`, `docs/DATA_ACCESS.md` e `docs/IMPLEMENTATION_PLAN.md`.

## Homologação DEV — 23/09/2026 (continuação)

- Migration `20260923010000_auth_rate_limits.sql` aplicada após autorização explícita.
- Tipos regenerados do DEV; `db:types:check` aprovado. O contrato da RPC já não é manual.
- Suíte isolada `auth_rate_limits.test.sql`: 18/18 asserções pgTAP aprovadas.
  A CLI mostrou apenas a última resposta na execução direta; a mesma suíte foi
  repetida com coleta das respostas em tabela temporária, sem alterar as asserções.
- As verificações de RLS/grants consultam os objetos reais. Os testes de comportamento
  usam o corpo instalado da função com tabela temporária e relógio fixado; não
  comprovam execução da RPC real como `service_role` nem concorrência.
- Antes/depois: `auth.users`, `admin_users` e `auth_rate_limits` com zero registros.
  A impressão do conteúdo de `auth_rate_limits` permaneceu idêntica. Após rollback,
  nenhuma tabela/função temporária da suíte ou fixture permaneceu.
- Histórico antes/depois: somente `20260923000000` e `20260923010000`, alinhadas
  local/remoto. Nenhuma migration adicional aplicada. Dry-run final sem pendências,
  seeds ou roles (`upToDate: true`).
- Lint, typecheck e build aprovados; Vitest: 71 testes em 12 arquivos aprovados.
- A suíte `admin_users.test.sql` permanece pendente: insere fixtures em `auth.users`
  e `admin_users`, e a exceção à proibição de inserção ainda não foi autorizada.
- E2E autenticado e revisão visual permanecem pendentes. Não declarar a Fase 3
  integralmente homologada. Nenhuma administradora criada, nenhuma configuração
  de produção, nenhum avanço à Fase 4 e nenhum commit.

Este registro atualiza as referências anteriores a migration/tipos/pgTAP pendentes;
resultados de smoke HTTP anteriores não foram reexecutados nesta continuação.
