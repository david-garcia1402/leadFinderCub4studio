# Lead Finder by cub4Studio — Português — v0.2.0

## Início rápido
Requer Node.js 22.9+ (testado com Node 24.19). Não há dependências externas de produção.
Abra um terminal nesta pasta e execute:

```bash
npm run dev
```

Página comercial: http://127.0.0.1:4173
Painel: http://127.0.0.1:4173/app

```bash
npm test
npm run build
```

O build já está incluído em `dist/`. Para rodar só a distribuição:

```bash
cd dist
node --env-file-if-exists=.env server.mjs
```

Não é um site puramente estático: o painel depende do servidor Node. Não abrir index.html diretamente. Não importar como tema Shopify. Não enviar a pasta dist diretamente a um Cloudflare Worker.

## O que mudou
- Página comercial em português, separada do painel, com copy de benefícios, recursos, FAQ e contato.
- Nova assinatura vetorial Lead Finder; mantém roxo/coral. É uma proposta visual do produto, não uma reprodução certificada da logo corporativa.
- Prévia do produto em HTML/CSS, nítida em qualquer tela e sem imagens de banco genéricas. Empresas da prévia são fictícias e identificadas.
- Três planos em colunas no desktop e empilhados no celular. Profissional em destaque.
- Preços propostos: R$ 39,99 / 59,99 / 89,99; franquias propostas: 100 / 300 / 600 empresas. Não estão conectados ao consumo. Devem ser validados antes de venda.
- CTA de interesse seleciona o plano e encaminha ao contato institucional; não existe checkout nem cadastro de lista de espera.
- Exemplos desativados por padrão. Nunca substitui silenciosamente a busca real por dados fictícios.
- Preservados filtros, favoritos no navegador, CSV e rascunho de abordagem.
- Configuração explícita de origem HTTPS, menor exposição de informações do servidor e restrição adicional para busca real local.

## Conectar a busca real para uso local
Copie `.env.example` para `.env`. Preencha `OUTSCRAPER_API_KEY`, defina `ENABLE_LIVE_SEARCH=true` e mantenha `HOST=127.0.0.1`. Use `APP_ORIGIN=http://127.0.0.1:4173` e abra exatamente esse endereço. Defina um teto conservador em `MAX_MONTHLY_RECORDS`. Reinicie o servidor. Se executar dist, coloque o .env dentro de dist.
Não inclua .env em ZIP, Git ou frontend. A chave permanece no servidor.
A integração foi preservada; não foi testada com credenciais reais. Antes de consumir, confirme custos, permissões e limites da sua conta no provedor. Nenhum crédito ou serviço foi contratado.
O teto local é global, não por assinante nem um teto financeiro no provedor. Reservas não são estornadas automaticamente em falhas. Use uma única instância; jobs/cache são em memória. A renovação mensal ocorre na inicialização. Não reinicie durante consultas pendentes.

## Exemplos para desenvolvimento
Opcionalmente defina `ENABLE_SAMPLE_DATA=true` e escolha a fonte de exemplos no painel. Dados ficam explicitamente identificados como fictícios. Não use exemplos como resultados reais em anúncios. Dados salvos nesta versão ficam apenas no navegador.

## Estado real do produto
Esta entrega melhora a apresentação comercial e a experiência, mas NÃO implementa um SaaS pago multiusuário. Não anunciar assinatura imediata nem retorno financeiro. A operação ao vivo permanece local. Uma restrição por IP/headers não substitui autenticação e pode depender do proxy; não exponha este backend com chave ativa à internet.

Antes de abrir assinaturas: autenticação e recuperação de acesso; banco com isolamento de clientes; créditos transacionais; checkout e webhooks idempotentes; autorização de buscas por assinatura; exclusão/retencão de dados; documentos reais de privacidade/termos; logs, proteção contra abuso e observabilidade; validação do fornecedor em produção. Conferir direitos de uso e condições do fornecedor. Não há pixels de publicidade nesta versão.

## Análise para campanha
A dor mais concreta é o tempo gasto procurando empresas e organizando prospecção. Público inicial sugerido: freelancers de sites e pequenas agências. Oferta: encontrar empresas por região e priorizar as que não têm site listado. Não alegar “clientes prontos para comprar” nem “empresas sem site confirmado”.
Antes de tráfego de assinatura: medir custo por resultado e margem, validar franquias, fazer busca real e pagamento/cancelamento de ponta a ponta. A página atual serve para apresentação e conversas de pré-lançamento; o contato aponta a cub4studio.com/#contato. Confirme esse destino antes de publicar.
Preços e franquias são hipóteses comerciais, não recomendações baseadas em tarifas atuais. Descontos por volume podem destruir a margem se o custo de dados for alto.

## Editar
`public/index.html`: página comercial, preços e contatos.
`public/landing.css`: identidade e layout.
`public/landing.js`: seleção de interesse.
`public/workspace.html`, `public/app.js`, `public/style.css`: painel.
`public/logo.svg`: símbolo vetorial.
`server.mjs` e `lib/`: backend e integração.
Depois de qualquer edição, execute npm test e npm run build para atualizar dist.

## Validação
Build Node e testes automatizados executados nesta entrega. Verificação HTTP de páginas, assets, bloqueio de exemplos, origem e proteção de arquivos internos. Validação visual em navegador depende da disponibilidade do Chromium no ambiente; veja VALIDATION.md. Nenhum pagamento, chamada paga ao provedor ou deploy público foi realizado.

## SEO deployment configuration / Configuração de SEO

Set `PUBLIC_SITE_URL` to this deployment's real HTTPS origin, without a path. Set `EN_SITE_URL` and `PT_BR_SITE_URL` to the two distinct production origins in **both** deployments to emit reciprocal hreflang links. These fields are not inferred from request headers or the corporate website. Blank/invalid `PUBLIC_SITE_URL` disables indexing (robots + X-Robots-Tag), omits canonical and makes `/sitemap.xml` return 503. This keeps staging/local deployments out of search.

Defina `PUBLIC_SITE_URL` com a origem HTTPS real desta versão, sem caminho. Configure `EN_SITE_URL` e `PT_BR_SITE_URL` nas duas versões. Valores vazios mantêm a indexação desativada. Reinicie o servidor após configurar. As versões são aplicações separadas e devem ser publicadas em origens distintas; hospedagem em subdiretórios não é suportada.

The server emits canonical/og:url, a landing-only sitemap and robots rules. The workspace has noindex. Localized title, description, Open Graph, Twitter summary and SoftwareApplication JSON-LD describe existing features. No paid Offer schema is published before billing exists. No ranking or rich-result guarantee.

Plan CTAs populate a local prospecting brief with plan, monthly price, service and target market. Visitors copy it and paste it into their conversation on the existing corporate contact page. No lead is automatically sent, registered or stored; no checkout is implemented. No analytics conversion is recorded.
