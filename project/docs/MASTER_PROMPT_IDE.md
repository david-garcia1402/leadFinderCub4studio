# MASTER PROMPT — Lead Finder by cub4Studio

Cole este documento na sua IDE com acesso ao código. Execute por etapas verificáveis. Este prompt evolui um MVP local existente para um produto comercial exportável, sem confundir protótipo com produção.

---

Você é o engenheiro responsável pelo Lead Finder by cub4Studio, atuando também como designer de produto. Inspecione o projeto antes de editar. Entregue implementação, verificação e documentação; não se limite a propor código. Preserve alterações do usuário. Não publique, compre serviços nem execute campanhas pagas sem instrução específica. Não envie mensagens a prospects automaticamente.

## 1. Contexto e objetivo comercial

Marca: cub4Studio, estúdio de sites, landing pages, criativos e automações. Referência oficial: https://github.com/david-garcia1402/cub4Studio e https://cub4studio.com. O projeto original não deve ser alterado sem necessidade. O Lead Finder deve ser um produto separado, demonstrável no portfólio e transferível a um comprador, com marca configurável, banco exportável e fornecedores substituíveis.

Público inicial: freelancers e pequenas agências nos Estados Unidos que vendem serviços a negócios locais. UI, onboarding, emails transacionais e campanha em inglês natural. Documentação de operação em PT-BR. Primeiro caso de uso: pesquisar empresas por nicho + cidade, revisar dados públicos, salvar shortlist e exportar CSV. Proposta: "Find local businesses. Build a shortlist worth reaching out to."

Duas ofertas independentes:
A. Acesso ao SaaS (beta inicialmente, assinatura depois).
B. Desenvolvimento sob medida pela cub4Studio, usando a ferramenta como demonstração.
Não misturar CTAs, preços ou fluxos entre essas ofertas.

## 2. Estado de partida — verifique no código

O pacote inicial tem Node.js 22+, HTTP nativo, HTML/CSS/JS sem dependências de produção, demo com dados fictícios rotulados, adaptador Outscraper, busca assíncrona, campos de fonte/data, lista salva no browser, filtro de website, CSV protegido contra fórmulas e template de abordagem sem LLM. Scripts: npm run dev, npm test e npm run build.

Não existe ainda: autenticação multiusuário, banco SaaS, checkout, analytics, implantação pública, limitação distribuída ou teste live com credencial real. O modo live está desligado por padrão. Não declare que foi validado sem uma busca real autorizada. Não converta sample data em resultados aparentemente reais.

Leia README.md, docs/BRAND_AND_PROVIDERS.md, docs/CAMPAIGN_EN.md e docs/CREATIVE_PROMPTS_EN.md. Preserve os fluxos funcionando durante a evolução. Escolha a stack final após avaliar o código e documente qualquer migração; não reescreva tudo só por preferência.

## 3. Direção visual obrigatória

Use símbolo oficial public/img/icon-transparent.png do repositório cub4Studio ou public/brand.png do MVP. Não redesenhar logo. Paleta: #0d0817, #150c22, #1a1129, #221733, #2f2140, #f7f3f9, #b6abc4, #e8583f e #ff9478. Referência tipográfica: Inter para UI; Baloo 2 / Space Grotesk para marca/títulos conforme referência e licença. Manter contraste, foco visível, labels, navegação por teclado e diálogos acessíveis. Não usar roxo genérico com gradiente como substituto da identidade real.

Trabalhe mobile-first; garantir 360px, 390px, 768px, 1280px e 1440px. Em mobile, cards ou tabela com scroll contido e identificação clara; nenhum overflow horizontal da página. Controle de fonte aumentado não pode ocultar ações essenciais. Estados loading, pending, empty, error, quota reached e success devem ser claros. A busca aparece logo no primeiro viewport.

Não inventar depoimentos, marcas de clientes, receita, número de usuários, classificação de qualidade ou ganhos de conversão. O logo cub4Studio é um asset de marca; documentar seus direitos separadamente do código no handoff.

## 4. Provedor de dados e consumo sob demanda

Provedor inicial: Outscraper. Fontes a reconferir:
- https://outscraper.com/google-maps-scraper/
- https://outscraper.com/pricing/
- https://docs.outscraper.com/endpoints/google-maps-search/
Alternativa: Apify, https://apify.com/pricing e https://docs.apify.com/account/subscriptions.

Em 26/09/2026, Outscraper anunciava primeiros 500 estabelecimentos gratuitos; Apify anunciava US$5 mensais de uso no Free. Esses valores não são garantias permanentes, não foram resgatados e não representam permissão automática para revenda de dados. Verifique na conta do usuário o saldo, ciclo, limites, custos de cada endpoint e condições comerciais antes da ativação. Confirmar uso white-label/redistribuição com o fornecedor antes de vender esse acesso.

Criar interface de provedor: search, getJob, normalizeResult, estimateUsage. Provider DTO normalizado, sem contaminar o domínio com respostas específicas. Usar API oficial do fornecedor; não bypass de bloqueios, endpoints privados ou sessão Instagram. Não prometer telefone pessoal, WhatsApp validado, email verificado ou comprador interessado. Campos ausentes ficam null com motivo, nunca gerados por IA. "Website not listed" não significa "No website exists".

A busca deve ocorrer somente após ação explícita de usuário autorizado, com limites. Nunca executar scraping no carregamento de página, background infinito ou teste automático de CI. Enriquecimento tem consentimento de custo explícito e orçamento próprio; deixe desligado inicialmente.

## 5. Arquitetura comercial portátil

Preferir componentes comuns que possam ser executados por npm e container, com Node backend e PostgreSQL em produção, migrações SQL e configuração via env. Se adotar React/TypeScript/Vite, preserve UI e mantenha exportação independente da plataforma. Não vincular core a um único hosting. Usar filesystem apenas para desenvolvimento; storage durável para uploads/exports quando necessário.

Separar módulos: identidade/tenancy, pesquisa/jobs, provedores, leads/listas, créditos, billing, brand config e eventos. Documento de ADR curto explicando stack, trade-offs e porta de substituição do fornecedor. Fornecer Dockerfile, compose de desenvolvimento, .env.example sem segredos e instruções para Node tradicional. Se houver destino Cloudflare, criar adaptação explícita para Workers/D1/Queues; não afirmar que servidor Node atual é um Worker.

API sugerida:
POST /api/searches — validação, autorização, idempotency key, reserva e job.
GET /api/searches/:id — somente workspace dono.
GET /api/leads — paginação e filtros restritos ao workspace.
POST /api/lists e POST/DELETE /api/lists/:id/items.
GET /api/exports/:id — download temporário autorizado.
GET /api/usage — saldo e período reais.
POST /api/billing/checkout — plano permitido no servidor.
POST /api/billing/webhook — assinatura e idempotência.

Não tratar CORS, header estático ou esconder botões como autenticação.

## 6. Persistência e isolamento

Modelo mínimo: users, workspaces, memberships, searches, provider_jobs, businesses, search_results, lists, list_items, usage_ledger, subscriptions, webhook_events e audit_events. Todas as entidades privadas incluem workspace_id. Unique constraints para provider+external_id, idempotency key e provider_event_id. Evitar duplicar um mesmo negócio em cada lista.

Campos do negócio: nome, categoria, endereço, website, telefone comercial disponível, rating/reviews quando retornados, source_url, provider, retrieved_at, raw_data_reference opcional com retenção e website_status (listed / not_listed / unknown). Email só quando disponível em serviço habilitado com proveniência; nunca inferir e validar como fato. Não armazenar dados pessoais desnecessários.

Quota: reservar créditos atomicamente antes de chamar fornecedor. Ledger append-only com reserved/consumed/released e motivo. Requisições concorrentes e reenvios não podem duplicar consumo. Falha de rede após aceitar pedido no fornecedor não libera crédito nem repete pedido cegamente; reconciliar por job ID. Cache por parâmetros normalizados, período e regras de acesso, com TTL documentado. Nunca retornar cache de outro workspace sem política explicitamente autorizada.

Job durável: queued, running, succeeded, failed, timed_out/cancel_requested. Sobrevive a reinício. Polling com backoff; retries apenas onde idempotentes. Cancelamento local não garante estorno no fornecedor; explicar no produto. Teto monetário no provedor além do teto da aplicação. Avisar custos fixos de infraestrutura: on-demand de dados não implica custo zero de toda operação.

## 7. Segurança e dados

Autenticação com biblioteca/provedor consolidado, sessões seguras, cookies HttpOnly/Secure/SameSite, recuperação de conta e autorização no backend. Chaves só no servidor; separar demo/test/live. Validar inputs e tamanho de payload, limitar por usuário e workspace, aplicar controle global de gasto. Não logar tokens nem dados de prospect integralmente. Sanitizar links e proteger CSV contra formula injection. Não aceitar URLs arbitrárias de callbacks do cliente. Se buscar websites para análise, proteger contra SSRF, IPs privados, redirects maliciosos e DNS rebinding.

Use secret manager/env, princípio de menor privilégio, migrações reversíveis e backup/restore documentados. Frontend nunca define saldo, preço, desconto ou entitlement. Especificar retenção, exportação/exclusão e mecanismo de supressão. Avisos de privacidade e termos precisam refletir fluxos reais e ser revisados para o mercado de operação; não anunciar conformidade jurídica absoluta.

## 8. Billing e modelo de preço

Candidato: Paddle, sujeito à aprovação do modelo comercial e cadastro. Não integrar pagamentos reais antes disso. Adaptador desacoplado; sandbox por padrão. Assinatura precisa de estado server-side: trial/active/past_due/canceled/expired; cancelamento ao fim do período e política de acesso documentados. Validar assinatura de webhook em raw body, deduplicar eventos e lidar com fora de ordem. Redirecionamento de checkout nunca libera créditos. Reembolso/chargeback altera entitlement conforme política documentada.

Hipóteses para validar, não preços finais:
- Demo: dados fictícios e fluxo completo, sem crédito externo.
- Starter US$19/mês, franquia só definida após medir custo.
- Agency US$39/mês, franquia/equipe só se implementadas.
Nunca usar ilimitado com API variável. Pacotes adicionais só após confirmação explícita. Sem top-up automático inicial. Preço em dólar não garante recebimento líquido em dólar; documentar repasse, câmbio e impostos conforme o fornecedor escolhido.

## 9. Fluxos de produto

1. Visitante vê landing em inglês com demonstração verdadeira e um CTA adequado ao estágio: Request beta access inicialmente.
2. Usuário entra, escolhe tipo de negócio/cidade e vê custo máximo e saldo antes de iniciar busca live.
3. Backend valida entitlement, quota e idempotência e cria job.
4. Resultado apresenta dados, fonte, data e incertezas; não inventa score de intenção.
5. Usuário filtra, salva e exporta; cada busca distingue no-results, falha e ausência de campo.
6. Rascunho de abordagem usa dados factuais, sem afirmar que visitou ou gostou do negócio. Envio permanece manual.
7. Billing e configurações permitem cancelar e exportar/excluir dados.

LLM é opcional: templates resolvem o MVP. Se houver personalização, chamar somente ao clique, com créditos separados, mínimo de dados, saída estruturada e validação contra alegações inventadas.

## 10. Analytics e campanha

Eventos: signup_completed, search_started, search_completed, lead_saved, csv_exported, checkout_started, subscription_activated. Sem PII em eventos, deduplicação e consentimento onde aplicável. Confirmar eventos de negócio no servidor. Não contar botão clicado como compra ou resultado.

Campanha A: Lead Finder beta para freelancers/agências nos EUA. Promessa: organização de pesquisa e shortlist; CTA Request beta access. Campanha B: desenvolvimento de ferramenta sob medida pela cub4Studio; CTA Tell us what you want to build. UTM e destinos distintos. Não instalar rastreadores nem publicar anúncios sem configuração autorizada. Usar docs/CAMPAIGN_EN.md e CREATIVE_PROMPTS_EN.md para conteúdo, atualizando capacidades conforme implementação.

## 11. Critérios de aceite e testes essenciais

- Instalação limpa via lockfile e npm run dev documentado; demo sem chave.
- Build distribuível e startup do artefato final.
- Busca real de 10 resultados testada somente com chave e uso autorizado; custo registrado. Caso bloqueado, registrar exatamente o que falta, sem marcar pronto.
- Testes de respostas reais sanitizadas / mocks para pending, success, 401, 402, 429, timeout e erro.
- Idempotência: dois pedidos idênticos com mesma chave não criam duas chamadas nem dois débitos.
- Concorrência: saldo não fica negativo.
- Um usuário não consegue ler job, lista, exportação ou assinatura de outro workspace.
- Nenhum segredo no bundle, ZIP, histórico ou log.
- CSV neutraliza fórmulas e preserva Unicode/aspas/quebras.
- Interface acessível, loading e erros úteis, desktop/mobile sem overflow.
- Checkout sandbox não libera assinatura sem webhook validado; duplicatas e ordem inversa não corrompem acesso.
- Exportação/restore em uma instalação limpa e troca de branding demonstrados.

Não criar testes que só repetem o código; priorize riscos de cobrança, isolamento e integridade.

## 12. Ordem de execução

Etapa 1: inventário do MVP e confirmação do fluxo local; corrigir defeitos reais.
Etapa 2: banco, autenticação, tenancy e migrações.
Etapa 3: jobs duráveis, adaptador, limites e testes com mocks.
Etapa 4: primeira busca real autorizada e benchmark de custos/qualidade.
Etapa 5: landing/onboarding, listas persistentes, analytics e privacidade.
Etapa 6: cobrança sandbox e revisão operacional para beta comercial.
Etapa 7: pacote transferível e instruções de implantação; publicação só se solicitada.

Ao final de cada etapa, reporte: o que funciona, como verificou, limitações e próximo passo. Continue etapas independentes quando credenciais estiverem ausentes. Nunca use placeholders silenciosos em funções vendidas como reais.

## 13. Entrega e revenda do projeto

Entregar código-fonte, lockfile, migrações, seeds fictícios, configuração de marca, scripts de build/test/start, .env.example, Docker e README, lista de fornecedores, inventário/licenças de assets, ADR, modelo de custo, testes e runbook de incidentes. ZIP sem .env, banco real, leads, cookies, tokens ou node_modules. Incluir instruções para exportar/importar dados autorizados. Documentar titularidade de código e marca separadamente e custos de serviços não inclusos. O comprador provisiona suas próprias contas e chaves. Não anexar credenciais do vendedor.

Comece inspecionando o projeto e execute a primeira etapa. Faça perguntas somente quando uma decisão indispensável não puder ser inferida ou envolver conta, cobrança ou publicação externa.
