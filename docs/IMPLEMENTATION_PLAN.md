# Plano de implementação incremental

Status: Fase 1 implementada; Fase 2 preparada, pendente de validação em banco e configuração do Cloud de desenvolvimento; fases 3–19 não iniciadas.
Base: [PROJECT_SPEC.md](PROJECT_SPEC.md) e [ARCHITECTURE.md](ARCHITECTURE.md).

Cada fase entrega uma capacidade pequena e verificável. Os caminhos abaixo são previstos, não arquivos já criados. Não fazer commits automaticamente. Revisar requisitos e impacto antes de iniciar cada fase; atualizar documentação quando uma decisão mudar.

## Regra para avançar

Após existir aplicação, executar lint, verificação TypeScript, testes aplicáveis e build antes de concluir uma fase. Corrigir falhas antes da próxima. Testes devem validar comportamento e fronteiras de segurança, não repetir implementação. Migrations exigem execução em banco descartável/staging e testes de RLS. Fases de interface exigem revisão mobile/desktop, teclado, estados vazio/carregamento/erro. Integrações exigem ambiente isolado e nunca dados de clientes reais.

Os nomes esperados dos scripts são `lint`, `typecheck`, `test` e `build`, a definir na fase 1. E2E e testes de integração ganham comandos próprios quando houver comportamento a testar. Cada fase abaixo inclui verificações específicas além dessa regra geral.

## Fase 1 — Fundação técnica

Registro de execução (23/09/2026): base criada com Next.js 16.3.6, React 19.3.0, TypeScript 5.9.3 e Tailwind CSS 4.3.3. Instalação limpa pelo lockfile, lint, typecheck, build e smoke HTTP da página/CSS verificados localmente. Vitest preparado, ainda sem testes de negócio. Workflow de CI criado; execução remota depende de push para GitHub. Decisões e comandos estão no [README](../README.md).

- **Objetivo:** preparar uma base executável e consistente, sem funcionalidades de produto.
- **Funcionalidades:** inicializar Next.js App Router, React, TypeScript estrito e Tailwind; fixar versões compatíveis e lockfile; configurar alias, ESLint, scripts, página técnica mínima e estrutura essencial; validar configuração básica e criar `.env.example` sem secrets; CI com lint/typecheck/build e preparação do runner de testes.
- **Áreas prováveis:** `package.json`, lockfile, `tsconfig.json`, configurações Next/Tailwind/ESLint, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/config/`, `.gitignore`, `.env.example`, workflow de CI e README.
- **Concluída quando:** instalação reproduzível, servidor local e build funcionam; imports e tipagem estrita estão ativos; CI passa. Não criar login, schema de negócio, painel, galerias, uploads ou integração real com Supabase nesta fase.
- **Verificações:** instalação limpa pelo lockfile, lint, typecheck, build e smoke da página técnica; confirmar ausência de secrets. Se ainda não houver comportamento de negócio, registrar que testes de negócio não se aplicam.

## Fase 2 — Conexão de dados e migrations

Registro de execução (23/09/2026): clientes separados, validação de ambiente, migration exclusiva de `admin_users`, testes unitários/pgTAP e comandos de geração preparados. Por decisão do usuário, desenvolvimento usa Supabase Cloud, sem Docker. Aplicação/reconstrução de migrations, testes SQL e geração real dos tipos permanecem pendentes da criação/conexão do projeto. O contrato TypeScript inicial é provisório. Não considerar esta fase integralmente validada. Procedimentos em [DATA_ACCESS.md](DATA_ACCESS.md).

- **Objetivo:** estabelecer acesso tipado e isolado ao Supabase.
- **Funcionalidades:** configurar ambiente local/staging, clientes SSR/browser/privilegiado separados, schemas de ambiente, migrations e geração de tipos; convenções de repository e erros; criar somente `admin_users` e suas restrições/políticas iniciais.
- **Áreas prováveis:** `src/infrastructure/supabase/`, `src/config/`, `src/types/database.ts`, `src/lib/errors/`, `supabase/migrations/`, `supabase/tests/`, `.env.example`.
- **Concluída quando:** migrations recriam a base; leitura não autorizada é negada; segredo de serviço não entra no bundle; ambientes são distintos.
- **Verificações:** aplicar/resetar migrations em banco descartável, gerar tipos sem drift, testar grants/RLS e falha por variável ausente; executar a regra geral.

## Fase 3 — Acesso administrativo

- **Objetivo:** permitir somente o acesso autenticado da fotógrafa.
- **Funcionalidades:** provisionamento controlado de uma conta, cadastro público desativado, login, logout, recuperação, renovação SSR e guard por sessão validada mais `admin_users.active`; painel vazio protegido; rate limiting de autenticação, redirects permitidos e proteção de mutações.
- **Áreas prováveis:** `src/features/auth/`, `src/application/`, `src/app/(auth)/`, `src/app/(admin)/`, `src/proxy.ts`, políticas e testes de segurança.
- **Concluída quando:** somente a administradora ativa entra no painel e executa ações; sessão expirada/desativação bloqueia chamadas diretas.
- **Verificações:** E2E login/logout/recuperação, sessão forjada, usuário autenticado não autorizado, chamada direta a API/Action, redirect malicioso e cache de sessão; regra geral.

## Fase 4 — Clientes e metadados de galerias

- **Objetivo:** permitir organizar entregas ainda sem fotografias.
- **Funcionalidades:** cadastro mínimo de clientes e CRUD de galerias em rascunho; título, descrição, data, expiração e configuração de download; listas paginadas e estados de interface.
- **Áreas prováveis:** migrations de `clients`/`galleries`, `src/domain/`, repositories, `src/features/clients/`, `src/features/galleries/`, páginas administrativas.
- **Concluída quando:** administradora cria e edita galerias vinculadas a clientes, sem expor conteúdo a visitantes; datas e campos inválidos são rejeitados.
- **Verificações:** CRUD, FKs, RLS, paginação, expiração/fuso, validação e exclusão de galeria vazia; revisão de interface e regra geral.

## Fase 5 — Contrato de Storage e upload de um original

- **Objetivo:** comprovar transferência direta com autorização restrita.
- **Funcionalidades:** contrato de Storage, adaptador Supabase, buckets privados, tabelas de fotos/assets/sessões; upload de um arquivo por intenção assinada; confirmação idempotente, limites e estado pendente de processamento.
- **Áreas prováveis:** `src/domain/media/`, `src/infrastructure/storage/`, migrations, `src/application/media/`, handlers de upload e componente administrativo mínimo.
- **Concluída quando:** original fica privado no Storage; Next.js recebe apenas metadados; chave e entidade são escolhidas/validadas pelo servidor; foto ainda não aparece para cliente.
- **Verificações:** contrato do adaptador, URL expirada, bucket privado, tentativa de sobrescrita, objeto de outra galeria, tamanho divergente, finalização duplicada e inspeção de rede para confirmar ausência de bytes de foto na Vercel; regra geral.

## Fase 6 — Upload múltiplo e retomável

- **Objetivo:** tornar o envio utilizável para ensaios grandes.
- **Funcionalidades:** TUS no adaptador cliente, drag and drop, lotes com concorrência limitada, progresso individual/total, cancelamento, retry, retomada e preview local com liberação de recursos.
- **Áreas prováveis:** `src/features/media/`, adaptador de transporte, contratos de intenção, handlers e testes de integração.
- **Concluída quando:** interrupção de rede não perde uploads já confirmados; retomada respeita a validade real do provedor; erros são apresentados por arquivo.
- **Verificações:** arquivos representativos, rede interrompida, credencial vencida, cancelamento, duplicidade, lote no limite e uso de memória do navegador; regra geral. Revalidar API TUS e limites oficiais antes de implementar.

## Fase 7 — Worker e variantes de imagem

- **Objetivo:** disponibilizar previews e thumbnails sem processamento pesado no Next.js.
- **Funcionalidades:** definir host do worker; fila durável PostgreSQL, claim/lease/retry/idempotência; validação de conteúdo, checksum, presets de variantes, remoção de EXIF dos derivados e estado de processamento; reconciliação de uploads abandonados.
- **Áreas prováveis:** `workers/media/`, `src/infrastructure/jobs/`, migrations de jobs, adaptador de streams, presets e interface de processamento.
- **Concluída quando:** foto só fica pronta com variantes confirmadas; original mantém bytes intactos; job pode ser reexecutado após queda; recursos do worker têm limites medidos.
- **Verificações:** imagem corrompida, MIME falso, excesso de pixels, orientação, qualidade visual, checksum, queda durante processamento, lease vencido, retry duplicado, limpeza de disco e memória sob lote; regra geral.

## Fase 8 — Gerenciamento das fotos na galeria

- **Objetivo:** completar a organização administrativa antes de compartilhar.
- **Funcionalidades:** grid administrativo com thumbnails, ordenar/remover fotos, definir capa, contagem/tamanho, publicar/arquivar galeria; exclusão assíncrona de objetos e atualização da versão de conteúdo.
- **Áreas prováveis:** `src/features/galleries/`, casos de uso, repositories, jobs de limpeza, constraints de capa e páginas do painel.
- **Concluída quando:** capa pertence à galeria, apenas fotos prontas são entregáveis e falhas de exclusão não deixam objetos acessíveis por novos links.
- **Verificações:** foto de outra galeria como capa, reordenação, remoção parcial com retry, agregações e estado vazio; revisão de interface e regra geral.

## Fase 9 — Compartilhamento e sessão de visitante

- **Objetivo:** estabelecer a autorização privada sem contas de clientes.
- **Funcionalidades:** token seguro, hash e armazenamento cifrado para recópia, senha opcional com Argon2id, sessão opaca em cookie, rotação, revogação e expiração; rate limiting persistente e headers privados desde a primeira rota.
- **Áreas prováveis:** tabelas de links/sessões, `src/lib/crypto/`, políticas de acesso, `src/app/(delivery)/galeria/`, handlers e painel de compartilhamento.
- **Concluída quando:** link válido cria sessão somente após a senha exigida; invalidar acesso bloqueia novas consultas; nenhuma foto ou dado do cliente é revelado antes da autorização.
- **Verificações:** tokens inválidos, senha errada, brute force, CSRF, ausência/expiração de cookie, rotação de link/senha, galeria arquivada, sessões simultâneas de galerias diferentes, logs sem secrets; regra geral.

## Fase 10 — Visualização privada

- **Objetivo:** entregar navegação confortável e protegida das fotos.
- **Funcionalidades:** grid paginado, lightbox, capa, lazy loading, URLs assinadas de variantes e renovação autorizada; estados vencido/indisponível sem detalhes sensíveis.
- **Áreas prováveis:** `src/features/galleries/components/`, páginas de entrega, serviço de URLs, schemas e testes E2E.
- **Concluída quando:** navegador carrega somente derivados apropriados, acesso é limitado à galeria da sessão e funciona em mobile/teclado.
- **Verificações:** acesso cruzado, tentativa de pedir original pela API de preview, assinatura expirada, cache compartilhado, noindex/referrer, grid extenso, foco e ausência de requests a originais; regra geral.

## Fase 11 — Download individual

- **Objetivo:** entregar o original com autorização atualizada.
- **Funcionalidades:** emissão de URL assinada por foto, nome seguro/disposição de anexo, respeito à configuração de download, eventos de solicitação/emissão e feedback de falha.
- **Áreas prováveis:** `src/features/downloads/`, casos de uso e handlers, migration de eventos, adaptador de Storage.
- **Concluída quando:** arquivo vai do Storage ao navegador; original corresponde ao checksum; desabilitar downloads impede novas emissões.
- **Verificações:** foto de outra galeria, sessão vencida, TTL limitado pela galeria, URL emitida antes de revogação, download grande sem Blob no frontend/proxy no backend; regra geral.

## Fase 12 — Seleção e download em lote

- **Objetivo:** permitir baixar selecionadas ou todas sem sobrecarregar a aplicação.
- **Funcionalidades:** seleção temporária, snapshot normalizado, job ZIP, limites/partes, progresso de preparação, polling, reutilização somente com versões válidas e limpeza de artefatos vencidos.
- **Áreas prováveis:** tabelas de solicitações/itens/artefatos, `workers/media/archives/`, serviços de downloads e interface de seleção.
- **Concluída quando:** ZIPs são gerados fora da Vercel, baixados diretamente do Storage e não expostos após falha de autorização; artefatos temporários são removidos.
- **Verificações:** conjunto grande com RAM/disco medidos, limite de partes, queda e retry, expiração durante job, foto removida, download desabilitado durante preparação, solicitação duplicada, seleção maliciosa e limpeza; regra geral.

## Fase 13 — Administração do portfólio

- **Objetivo:** gerenciar conteúdo editorial separado das galerias privadas.
- **Funcionalidades:** projetos, categorias iniciais, descrição, capa, ordem, upload reaproveitando pipeline, publicar/despublicar e excluir; derivados públicos explícitos e originais privados. CRUD completo de categorias pode ficar para evolução posterior.
- **Áreas prováveis:** migrations de categorias/projetos, `src/features/portfolio/`, painel e jobs de publicação/limpeza de mídia pública.
- **Concluída quando:** só projetos publicados têm derivados públicos; nenhuma publicação muda permissões de galerias privadas.
- **Verificações:** rascunhos, capa de outro projeto, slug duplicado, publicação parcial, despublicação/cache, exclusão e isolamento entre Storage público/privado; regra geral.

## Fase 14 — Portfólio público

- **Objetivo:** apresentar projetos e categorias com foco nas fotografias.
- **Funcionalidades:** listagem, filtro por categoria, página por slug, lightbox acessível, imagens responsivas, metadata/canonical/Open Graph e revalidação de conteúdo publicado.
- **Áreas prováveis:** `src/app/(public)/portfolio/`, componentes públicos, consultas de leitura e metadata.
- **Concluída quando:** rascunhos não aparecem, URLs são amigáveis e a navegação não usa originais.
- **Verificações:** acesso direto a rascunho, publicação/despublicação, cache, SEO por projeto, mobile/teclado e métricas de imagem/layout; regra geral.

## Fase 15 — Páginas institucionais

- **Objetivo:** completar a apresentação da fotógrafa.
- **Funcionalidades:** home, sobre, serviços, navegação/rodapé, redes sociais e depoimentos; conteúdo tipado em `site_settings`, `services` e `testimonials`, inicialmente alimentado por seed controlado, sem construir um CMS adicional.
- **Áreas prováveis:** páginas públicas, componentes de layout, migrations/seed editorial, design tokens e consultas.
- **Concluída quando:** conteúdo real aprovado ocupa as páginas, imagens editoriais são publicadas explicitamente e layout é consistente em telas pequenas/grandes.
- **Verificações:** links, alt text, contraste, teclado, layout, carregamento, estados vazios e metadata; regra geral. Não publicar depoimentos ou textos fictícios como reais.

## Fase 16 — Contato e orçamento

- **Objetivo:** receber solicitações sem perder dados nem expor contatos.
- **Funcionalidades:** formulário da especificação, persistência validada, feedback, proteção contra spam/rate limiting e listagem administrativa mínima; contrato para futuras notificações sem integrar e-mail/WhatsApp/CRM nesta fase.
- **Áreas prováveis:** `src/features/contact/`, página de contato, handler/Action, `contact_requests`, painel e políticas.
- **Concluída quando:** confirmação só ocorre após gravação e solicitações são visíveis somente à administradora.
- **Verificações:** campos inválidos, envio duplicado, indisponibilidade do banco, spam, CSRF, tentativas de leitura anônima e ausência de dados pessoais em logs; regra geral.

## Fase 17 — Dashboard e visibilidade operacional

- **Objetivo:** apresentar o estado real das entregas e do processamento.
- **Funcionalidades:** totais de galerias/ativas/expiradas/fotos/bytes, downloads solicitados/recentes, falhas de processamento e retry administrativo controlado; auditoria das mutações sensíveis.
- **Áreas prováveis:** dashboard, queries agregadas, `audit_events`, observabilidade e componentes de status.
- **Concluída quando:** métricas são consistentes com objetos confirmados e distinguem URL emitida de transferência concluída.
- **Verificações:** exclusões, uploads pendentes, galerias vencidas, retry autorizado, paginação de eventos e custo das consultas; regra geral.

## Fase 18 — Revisão integrada de segurança, SEO e acessibilidade

- **Objetivo:** validar o produto completo antes de produção; controles de segurança já devem existir nas fases anteriores.
- **Funcionalidades:** finalizar sitemap/robots/Schema.org pertinente, revisar headers/CSP, estados de erro, fluxo por teclado, retenção e páginas de privacidade/termos com conteúdo revisado; corrigir apenas problemas encontrados.
- **Áreas prováveis:** metadata, sitemap/robots, headers, testes E2E, componentes afetados e documentação operacional.
- **Concluída quando:** jornadas pública, administrativa e privada passam; não há vazamento entre galerias, originais públicos ou dados privados indexáveis.
- **Verificações:** matriz completa de autorização/RLS, CSRF, rate limiting, logs/bundle sem secrets, cache e TTL, auditoria de acessibilidade, desempenho com galeria representativa e SEO; regra geral.

## Fase 19 — Deploy e prontidão operacional

- **Objetivo:** disponibilizar a primeira versão com recuperação e monitoramento verificáveis.
- **Funcionalidades:** Vercel e domínio, Supabase de produção, worker externo, secrets, CORS, regiões, migrations controladas, jobs recorrentes, alertas, quotas, backups de banco/objetos e procedimentos de rollback/restauração.
- **Áreas prováveis:** pipeline, configuração de deploy/worker e `docs/` com runbooks. Contratação/provisionamento depende dos acessos e planos efetivamente disponíveis nessa etapa.
- **Concluída quando:** staging validado, restore ensaiado, limites de recursos/custos definidos, smoke de produção aprovado e monitoramento ativo. Publicação segue a autorização vigente no momento da execução.
- **Verificações:** pipeline completo, isolamento de ambientes, restauração banco+Storage, rollback compatível com schema, queda do worker, backlog/alertas, expiração/limpeza real e upload/download grande ponta a ponta.

## Evoluções posteriores, fora da primeira versão

Migração para R2/S3 deve ser um projeto próprio: adaptador e testes de contrato → cópia com verificação → convivência de leituras → troca de novas gravações → janela de rollback → retirada da origem. Não implementar três provedores agora.

Contas de clientes, favoritos persistentes, aprovação, pagamentos, venda de fotos, calendário, notificações automáticas e CRM exigem novos requisitos e fases próprias. A seleção temporária de fotos e os ZIPs já pertencem às fases 11–12.

A implementação atual termina na preparação da Fase 2; sua validação em banco está pendente. A Fase 3 exige nova instrução; nenhum serviço externo foi provisionado.
