# PROJECT_SPEC.md

## Visão geral

Criar um site profissional completo para uma fotógrafa.

O projeto deverá funcionar como:

1. Portfólio profissional;
2. Site institucional;
3. Canal de contato e captação de clientes;
4. Plataforma privada para entrega e download de fotos.

A aplicação deve ser moderna, responsiva, performática, segura e preparada para produção.

---

## Objetivos principais

O sistema deverá permitir:

- apresentar o trabalho da fotógrafa;
- exibir portfólio por categorias;
- apresentar serviços;
- receber contatos e pedidos de orçamento;
- disponibilizar galerias privadas para clientes;
- permitir download individual ou em lote;
- permitir gerenciamento através de painel administrativo.

---

## Design

O design deve ser:

- moderno;
- elegante;
- sofisticado;
- minimalista;
- responsivo;
- focado em fotografia;
- intuitivo;
- visualmente limpo.

As fotografias devem ser o principal elemento visual.

Evitar aparência genérica de template.

Utilizar:

- boa hierarquia tipográfica;
- bastante espaço visual;
- animações sutis;
- microinterações;
- transições suaves;
- boa experiência em dispositivos móveis.

---

# Área pública

## Home

A página inicial deverá conter:

- hero section com fotografia de destaque;
- nome ou marca da fotógrafa;
- frase de posicionamento;
- botão para acessar portfólio;
- apresentação resumida;
- categorias principais;
- trabalhos recentes;
- depoimentos;
- chamada para orçamento;
- redes sociais;
- rodapé completo.

---

## Portfólio

Criar uma página de portfólio organizada por categorias.

Exemplos:

- Ensaios;
- Casamentos;
- Casais;
- Família;
- Eventos;
- Corporativo;
- Outros.

As categorias devem ser administráveis futuramente.

Cada projeto poderá possuir:

- título;
- descrição;
- categoria;
- imagem de capa;
- conjunto de fotografias;
- data;
- status de publicação.

As galerias devem permitir visualização ampliada através de Lightbox.

---

## Sobre

Página para apresentar:

- fotógrafa;
- história;
- experiência;
- estilo fotográfico;
- diferenciais;
- fotografia profissional.

---

## Serviços

Cada serviço poderá possuir:

- título;
- descrição;
- imagem;
- informações básicas;
- botão para solicitar orçamento.

---

## Contato e orçamento

Criar formulário contendo:

- Nome;
- WhatsApp;
- E-mail;
- Tipo de ensaio;
- Data pretendida;
- Local;
- Mensagem.

Implementar:

- validação dos campos;
- tratamento de erros;
- confirmação após envio.

A arquitetura deverá permitir integração futura com:

- e-mail;
- WhatsApp;
- CRM.

---

# Área do cliente

A aplicação deverá possuir uma área privada para entrega de fotografias.

Cada galeria deverá possuir:

- cliente;
- nome do ensaio ou evento;
- data;
- capa;
- descrição opcional;
- fotografias;
- quantidade de arquivos;
- tamanho total;
- data de criação;
- data de expiração opcional;
- configuração de download.

Após criação, deverá ser gerado um link exclusivo.

Exemplo:

`/galeria/token-seguro`

---

## Privacidade das galerias

A fotógrafa poderá configurar:

- galeria acessível através de link;
- galeria protegida por senha;
- galeria protegida por token;
- data de expiração;
- download habilitado ou desabilitado.

Galerias privadas não devem ser indexadas por mecanismos de busca.

Arquivos privados não devem possuir URLs públicas previsíveis.

Utilizar URLs assinadas ou mecanismo equivalente.

---

## Visualização das fotos

O cliente poderá:

- visualizar fotos;
- ampliar fotos;
- navegar pela galeria;
- selecionar fotografias;
- baixar fotos individualmente;
- selecionar várias fotografias;
- baixar todas as fotografias.

---

## Downloads

Adicionar:

- download individual;
- download de múltiplas imagens;
- opção "Baixar todas as fotos".

Para grandes quantidades de arquivos, utilizar uma estratégia eficiente de download.

Quando tecnicamente adequado, gerar arquivo ZIP.

Exibir feedback visual durante downloads longos.

---

# Painel administrativo

Criar área administrativa exclusiva para a fotógrafa.

Exemplo:

`/admin`

A área administrativa deverá exigir autenticação.

---

## Dashboard

Mostrar informações como:

- total de galerias;
- galerias ativas;
- galerias expiradas;
- quantidade de fotografias;
- espaço de armazenamento utilizado;
- downloads recentes.

---

## Gerenciamento de portfólio

Permitir:

- criar projeto;
- editar projeto;
- excluir projeto;
- publicar;
- despublicar;
- selecionar categoria;
- escolher imagem de capa;
- adicionar fotografias;
- remover fotografias;
- alterar ordem das fotografias.

---

## Gerenciamento de galerias

Permitir:

- criar galeria;
- editar galeria;
- excluir galeria;
- adicionar fotografias;
- remover fotografias;
- definir senha;
- definir expiração;
- ativar download;
- desativar download;
- copiar link privado;
- acompanhar downloads.

---

# Upload

O upload deverá suportar:

- múltiplos arquivos;
- drag and drop;
- barra de progresso;
- tratamento de erro;
- retry;
- preview;
- arquivos grandes.

Não armazenar fotografias diretamente no banco de dados.

Utilizar Object Storage.

---

# Imagens e armazenamento

O sistema deverá trabalhar com diferentes versões das imagens.

Exemplo:

- thumbnail;
- preview;
- original.

A imagem original deve ser preservada para download.

A navegação normal não deve carregar os arquivos originais.

Implementar quando aplicável:

- lazy loading;
- imagens responsivas;
- WebP;
- AVIF;
- cache;
- CDN;
- carregamento progressivo.

---

# Arquitetura

A aplicação deverá utilizar arquitetura limpa e organizada.

Separar corretamente:

- componentes;
- páginas;
- features;
- serviços;
- hooks;
- tipos;
- schemas;
- repositories;
- utilities;
- regras de negócio.

Evitar:

- componentes gigantes;
- duplicação;
- forte acoplamento;
- lógica de negócio misturada com interface;
- valores hardcoded.

---

# Stack sugerida

Preferencialmente:

## Frontend

- Next.js;
- React;
- TypeScript;
- Tailwind CSS.

## Backend e banco

- PostgreSQL;
- Supabase.

## Armazenamento

Considerar:

- Supabase Storage;
- Cloudflare R2;
- AWS S3.

A camada de armazenamento deverá possuir baixo acoplamento para permitir troca futura de fornecedor.

---

# Segurança

Implementar boas práticas para:

- autenticação;
- autorização;
- proteção de rotas;
- validação de dados;
- upload seguro;
- proteção de arquivos;
- URLs assinadas;
- tokens;
- variáveis de ambiente;
- rate limiting quando necessário.

Nenhuma credencial sensível deverá ficar exposta no frontend.

---

# SEO

Implementar:

- title;
- description;
- metadata;
- Open Graph;
- sitemap;
- robots.txt;
- URLs amigáveis;
- alt text;
- Schema.org quando relevante.

Galerias privadas não devem aparecer em mecanismos de busca.

---

# Acessibilidade

Seguir boas práticas:

- HTML semântico;
- contraste adequado;
- navegação por teclado;
- labels;
- alt text;
- foco visível.

---

# Responsividade

O projeto deverá funcionar corretamente em:

- smartphones;
- tablets;
- notebooks;
- desktops;
- telas grandes.

Utilizar abordagem mobile-first.

---

# LGPD

Como o sistema poderá armazenar fotografias de clientes, considerar boas práticas relacionadas à LGPD.

Adicionar futuramente:

- Política de Privacidade;
- Termos de Uso.

---

# Evoluções futuras

A arquitetura deverá permitir adicionar futuramente:

- contratação de ensaios;
- pagamentos online;
- seleção de fotos favoritas;
- aprovação de fotos;
- venda de fotos;
- orçamento automático;
- calendário de disponibilidade;
- Google Calendar;
- WhatsApp;
- notificações;
- e-mails automáticos;
- analytics.

Não é necessário implementar essas funcionalidades inicialmente.

---

# Qualidade do código

Antes de implementar funcionalidades importantes:

1. entender o requisito;
2. analisar impacto;
3. definir abordagem;
4. implementar;
5. validar;
6. executar lint;
7. executar TypeScript check;
8. executar testes aplicáveis;
9. corrigir erros.

O projeto deve ser desenvolvido de forma incremental.

Não tentar construir todo o sistema de uma única vez.

---

# Resultado esperado

A primeira versão deverá possuir:

- site institucional;
- home;
- portfólio;
- sobre;
- serviços;
- contato;
- área privada para clientes;
- galerias;
- downloads;
- painel administrativo;
- gerenciamento de portfólio;
- gerenciamento de galerias;
- autenticação;
- banco de dados;
- armazenamento de imagens;
- layout responsivo;
- boa performance;
- arquitetura limpa.