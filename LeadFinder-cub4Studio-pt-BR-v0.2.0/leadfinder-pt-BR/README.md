# Lead Finder CRM — Português (Brasil)

## Iniciar

Requer Node.js 22.9 ou posterior; não usa pacotes externos em produção. Copie `.env.example` para `.env` e execute `npm run dev`. A página comercial abre em `http://127.0.0.1:4173`, o login em `/entrar` e o CRM em `/app`.

Para colocar no ar, use processo Node contínuo atrás de HTTPS e disco persistente para `.data`. O aplicativo guarda dados em JSON local e buscas pendentes em memória; use uma instância por pasta de dados. Não publique como site estático/serverless nem compartilhe a mesma pasta de dados entre as versões em inglês e português.

## Como funciona para o cliente

O cliente cria a conta, paga o plano e busca dentro do Lead Finder. Não precisa criar conta no Outscraper, configurar API key ou comprar créditos. Os planos incluem 100, 300 ou 600 empresas solicitadas por ciclo de cobrança. Cada busca aceita até 25. O limite pedido fica reservado antes da consulta para evitar repetição de custos quando a fonte demora ou falha; resultados repetidos em cache não geram nova consulta. Sua franquia de software é separada do custo da fonte de dados, pago pelo operador.

O CRM inclui etapas do funil editáveis, contatos, valor, etiquetas, notas, campos personalizados, probabilidade por etapa, histórico, tarefas de acompanhamento, atrasos, filtros, arquivamento com restauração e importação/exportação CSV protegida. Cada conta tem dados próprios, salvos em `.data/accounts.json`. O sistema guarda registros e rascunhos, mas não envia mensagens ou notificações externas. O atalho do Google Maps abre uma pesquisa manual; a URL do Maps não fornece importação automática. As empresas são importadas pela busca integrada no servidor.

## Configurar os planos pagos

Defina `BILLING_PROVIDER=kiwify` ou `hosted`. Para Kiwify, configure os três links HTTPS, IDs reais de produto e `KIWIFY_WEBHOOK_TOKEN`. Para checkout hospedado genérico, preencha `CHECKOUT_URL_ESSENCIAL`, `CHECKOUT_URL_PROFISSIONAL`, `CHECKOUT_URL_ESCALA`, `BILLING_PRODUCT_*` e um `BILLING_WEBHOOK_SECRET` aleatório. Configure eventos de pagamento aprovado, renovação, estorno e cancelamento em `{APP_ORIGIN}/api/billing/webhook/kiwify` ou `/hosted`. Prefira assinatura HMAC SHA-256 no cabeçalho `x-billing-signature`. Mapeie IDs de produto a cada plano e use o mesmo e-mail da compra na conta Lead Finder. Os planos só aparecem como disponíveis depois de configurar link e autenticação do webhook; pagamentos não confirmados não liberam acesso.

O Mercado Pago é opcional. Configure a API, o segredo de webhook e uma origem HTTPS pública. Antes de habilitar cartão recorrente, confirme suporte a BRL e assinaturas no seu cadastro. Os planos seguem R$ 39,99, R$ 59,99 e R$ 89,99 por mês, com franquias 100/300/600.

## Ativar as buscas internas

Depois de confirmar vendas, cadastre uma API key do Outscraper que pertença à sua empresa no servidor e defina `ENABLE_LIVE_SEARCH=true`. Cadastre uma forma de pagamento aceita pelo Outscraper. A tabela atual lista 500 primeiros registros do Google Maps gratuitos e cobrança pós-paga acima da faixa gratuita; consulte preços, saldo, uso anterior e condições vigentes na sua conta antes de liberar a busca. O aplicativo nunca envia a chave ao navegador.

O teto inicial é 500 registros pedidos em uma janela de 30 dias; ajuste `OUTSCRAPER_RECORD_CAP` para baixo se quiser restringir o gasto. O teto soma franquias reservadas, mesmo sem resultados, para não ocultar consultas que o provedor pode cobrar. Ele é compartilhado por todas as contas Lead Finder e gravado junto aos dados no servidor. Para iniciar uma nova janela, verifique a fatura/uso da conta Outscraper, informe conscientemente um novo `OUTSCRAPER_BUDGET_START` e reinicie o serviço. O contador não vê o uso de outros aplicativos na mesma conta do Outscraper. Não aumente o teto sem considerar esse saldo. Renovação do Lead Finder não redefine o teto do operador.

## Idioma, planos e dados

Defina `PUBLIC_SITE_URL` com HTTPS sem caminho e as URLs `EN_SITE_URL` e `PT_BR_SITE_URL` iguais nas duas instalações. O arquivo de exemplo já traz links de checkout da Kiwify da proposta anterior; eles ficam desativados até o token do webhook estar configurado. Nunca coloque credenciais no Git ou ZIP.

O armazenamento JSON é para uma pequena instalação de processo único. Use disco persistente e cópia protegida de `.data/accounts.json`. Antes de escalar, planeje verificação de e-mail, recuperação de senha, cópias/restauração no banco, retenção e exclusão de conta. Os dados são pessoais/comerciais, então não publique backups nem logs com credenciais.

## Distribuição

`npm run build` cria a versão portátil em `dist`. Configure o `.env` de produção fora do pacote e execute `npm run start`. O pacote inclui código, telas e `.env.example`, mas não inclui chave do provedor nem dados de clientes.
