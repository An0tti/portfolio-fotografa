# Portfolio Fotógrafa

Fundação técnica de um projeto Next.js com App Router, React, TypeScript estrito e Tailwind CSS. Somente a Fase 1 está implementada: a rota `/` exibe uma página técnica de confirmação.

## Pré-requisitos

- Node.js **24.21.0**, fixado em `.nvmrc`.
- npm **11.19.0**, indicado em `packageManager`.
- Git.

Use seu gerenciador de versões de Node.js para instalar/selecionar a versão indicada. No PowerShell, se `npm.ps1` estiver bloqueado, execute `npm.cmd` no lugar de `npm`, sem alterar a política de execução do sistema.

## Instalação e execução local

Na raiz do repositório:

```sh
npm ci
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A página deve mostrar “Aplicação funcionando.”. Para encerrar, use `Ctrl+C` no terminal.

Nenhuma variável de ambiente é necessária nesta fase. `.env.example` contém apenas um placeholder público comentado, reservado para a origem do site. Não é preciso criar `.env.local`. Quando houver variáveis em uso, copie o exemplo, substitua os placeholders e mantenha valores reais somente no arquivo local ignorado pelo Git. Não há configuração de Supabase nesta etapa.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint; qualquer warning faz a verificação falhar |
| `npm run typecheck` | Gera os tipos de rotas do Next.js e executa TypeScript sem emitir código |
| `npm test` | Executa o runner Vitest preparado para testes unitários futuros |
| `npm run build` | Gera o build de produção |
| `npm start` | Serve o build de produção já gerado |

O runner ainda não possui testes: nesta fase, `npm test` informa a ausência deles e termina com sucesso. Isso não representa cobertura de testes. Regras de negócio e testes correspondentes serão adicionados nas fases apropriadas; remover `passWithNoTests` ao adicionar a primeira suíte. O smoke da página consiste em iniciar o servidor e conferir a resposta de `/`.

Antes de avançar, execute:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

O workflow `.github/workflows/ci.yml` executa esses mesmos comandos após `npm ci`, em push e pull request. A execução remota depende de o repositório estar no GitHub com Actions habilitado.

## Estrutura inicial

```text
.github/workflows/ci.yml  # verificações automatizadas
docs/                    # requisitos, arquitetura e plano
src/app/
  globals.css            # Tailwind e estilos globais mínimos
  layout.tsx             # documento HTML e metadata técnica
  page.tsx               # página de confirmação
```

O alias `@/*` aponta para `src/*` no TypeScript e no Vitest. Diretórios de domínio, features, infraestrutura e configurações de serviços serão criados apenas quando necessários. Nesta fase não há parâmetros de aplicação que justifiquem um módulo `src/config`.

## Decisões da fundação

- Dependências diretas com versões exatas; `package-lock.json` fixa a árvore transitiva. Use `npm ci` para reproduzir a instalação e `.npmrc` mantém futuras instalações com `save-exact=true`.
- TypeScript com `strict: true`, código da aplicação em `.ts`/`.tsx` e regra ESLint que proíbe `any` explícito.
- ESLint com flat config e presets Next.js Core Web Vitals/TypeScript.
- ESLint **9.39.5** permanece fixado por compatibilidade com os plugins React/importação/acessibilidade de `eslint-config-next@16.3.6`. O npm sinaliza fim de suporte dessa versão; a tentativa com ESLint 10.11.0 apresentou conflito de peers e falha em `react/display-name`. Reavaliar a atualização conjunta dos presets e do ESLint quando suportada, sem desabilitar regras ou forçar peers incompatíveis.
- Tailwind CSS 4 via PostCSS e `@import "tailwindcss"`; não requer `tailwind.config.js` para esta configuração mínima.
- Server Components por padrão, sem bibliotecas visuais ou fontes externas. O build não depende de download de fontes.
- `agentRules: false` impede que `next dev` acrescente instruções automaticamente ao `AGENTS.md` existente.
- Página técnica com `lang="pt-BR"`, layout responsivo e metadata `noindex` enquanto não há conteúdo público de produto.
- `.env*` é ignorado, exceto `.env.example`; `node_modules`, `.next` e tipos/artefatos gerados também são ignorados.
- Inicialização manual conforme a [instalação oficial do Next.js](https://nextjs.org/docs/app/getting-started/installation), preservando os documentos existentes. Configuração conforme os guias de [ESLint](https://nextjs.org/docs/app/api-reference/config/eslint) e [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## Documentação do projeto

- [Requisitos](docs/PROJECT_SPEC.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de implementação](docs/IMPLEMENTATION_PLAN.md)

As fases seguintes não foram iniciadas. Não há banco, autenticação, painel, portfólio, galerias, upload, funcionalidades de cliente ou worker.
