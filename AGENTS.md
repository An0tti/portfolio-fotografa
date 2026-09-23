# AGENTS.md

## Projeto

Este repositório contém o desenvolvimento de um site profissional para uma fotógrafa.

A aplicação terá duas funções principais:

1. Site institucional e portfólio profissional.
2. Plataforma privada para entrega e download de fotografias aos clientes.

O sistema deve ser desenvolvido com qualidade de produção e não apenas como um protótipo visual.

---

## Stack principal

Utilizar preferencialmente:

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Supabase para banco de dados e autenticação
- Object Storage para fotografias

O armazenamento de fotografias deve ser desacoplado da aplicação para permitir futuramente utilizar:

- Supabase Storage
- Cloudflare R2
- AWS S3

---

## Princípios de desenvolvimento

Sempre priorizar:

- código limpo;
- arquitetura escalável;
- separação de responsabilidades;
- componentes reutilizáveis;
- tipagem forte;
- nomes claros;
- baixo acoplamento;
- segurança;
- performance;
- acessibilidade;
- responsividade.

Evitar:

- arquivos excessivamente grandes;
- componentes monolíticos;
- duplicação de código;
- lógica de negócio diretamente em componentes visuais;
- valores hardcoded;
- credenciais no frontend;
- soluções temporárias sem justificativa.

---

## TypeScript

Utilizar TypeScript em toda a aplicação.

Evitar `any`.

Criar interfaces e tipos apropriados para:

- usuários;
- clientes;
- galerias;
- fotografias;
- projetos do portfólio;
- serviços;
- downloads.

---

## Frontend

O site deve possuir aparência:

- moderna;
- sofisticada;
- minimalista;
- elegante;
- focada em fotografia.

As fotografias devem ser o principal elemento visual.

Utilizar:

- design responsivo;
- mobile-first;
- boa hierarquia tipográfica;
- animações discretas;
- microinterações;
- loading states;
- empty states;
- feedback visual;
- tratamento de erros.

---

## Imagens

Performance de imagens é prioridade.

Nunca carregar a fotografia original de alta resolução na visualização normal da galeria.

Utilizar versões apropriadas para:

- thumbnail;
- preview;
- download original.

Implementar quando necessário:

- lazy loading;
- imagens responsivas;
- WebP/AVIF;
- cache;
- CDN;
- carregamento progressivo.

---

## Segurança

Galerias privadas não podem possuir arquivos expostos através de URLs públicas previsíveis.

Utilizar mecanismos como:

- URLs assinadas;
- tokens seguros;
- autenticação;
- autorização;
- expiração.

Rotas administrativas devem ser protegidas.

Nunca armazenar secrets ou credenciais no código.

Utilizar variáveis de ambiente.

---

## Banco de dados

Não armazenar arquivos de imagem diretamente no banco.

O banco deve armazenar apenas:

- metadados;
- referências;
- permissões;
- informações relacionadas aos arquivos.

---

## Desenvolvimento

Antes de implementar funcionalidades grandes:

1. Entender o requisito.
2. Analisar a arquitetura existente.
3. Propor a abordagem.
4. Verificar impacto em outras áreas.
5. Implementar.
6. Executar lint.
7. Executar testes aplicáveis.
8. Corrigir erros encontrados.

Não tentar construir todo o sistema de uma única vez.

Trabalhar de forma incremental.

---

## Git

Não fazer commits automaticamente sem solicitação do usuário.

Separar funcionalidades grandes em etapas.

---

## Documentação

O requisito completo do projeto ficará em:

docs/PROJECT_SPEC.md

Sempre consultar esse documento antes de implementar funcionalidades importantes.
