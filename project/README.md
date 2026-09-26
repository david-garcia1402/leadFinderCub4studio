# Lead Finder by cub4Studio

MVP local exportável. Interface em inglês, com identidade baseada no repositório cub4Studio. Não é ainda um SaaS multiusuário pronto para receber pagamentos.

## Rodar no seu computador

Instale Node.js 22 ou superior. Extraia a pasta e execute:

```bash
npm install
npm run dev
```

Abra http://localhost:4173. O modo demonstrativo funciona sem conta, chave ou cobrança. `npm test` executa verificações de segurança de dados; `npm run build` cria uma distribuição Node em `dist/`. Não é um build estático: a busca real exige backend. Não subir diretamente como Worker sem adaptação.

## O que funciona

- Busca demonstrativa por segmento e localização, com dados fictícios identificados.
- Integração de servidor com API Outscraper, busca assíncrona e consulta do resultado.
- Filtros de texto e presença de website; ordenação; detalhes e fonte.
- Lista salva no navegador, removível ao clicar em Saved; exportação CSV.
- Rascunho de abordagem determinístico; nenhuma IA paga ou envio automático.
- Proteção da chave no servidor, CSV contra fórmulas, limite por busca, reserva local de consumo e cache em memória.

## Ativar dados reais

1. Crie sua conta pessoal no provedor: https://outscraper.com/google-maps-scraper/
2. Confira no painel a franquia gratuita, exigências da conta, tarifas, limites e permissão para o uso comercial pretendido. Nenhum crédito foi resgatado neste projeto.
3. Copie `.env.example` para `.env` (no Windows pode usar `copy .env.example .env`).
4. Configure `OUTSCRAPER_API_KEY`, `ENABLE_LIVE_SEARCH=true` e um teto conservador em `MAX_MONTHLY_RECORDS` (padrão 100).
5. Reinicie `npm run dev`, selecione Live · Outscraper e faça uma busca de 10 resultados.

A integração foi construída com a documentação oficial, mas não foi testada com uma conta real. Não forneça sua chave no frontend ou em prompts públicos. Não habilitamos enriquecimento de e-mails, telefone privado nem busca de Instagram. O limite local NÃO acompanha usos feitos por outras aplicações na mesma conta e NÃO constitui um teto monetário no provedor. Configure o limite no painel também. Reservas em `.data/usage.json` não são estornadas automaticamente em falhas, para evitar consumo repetido; cheque o painel antes de alterar. Execute uma única instância local. Reiniciar perde cache e jobs em memória; não reinicie durante buscas. O mês da franquia local é UTC, renovado ao iniciar o servidor.

## Estrutura transferível

- `public/`: interface sem dependências externas, logo original e CSS.
- `lib/leads.mjs`: validação, normalização e CSV.
- `lib/outscraper.mjs`: adaptador substituível do fornecedor.
- `server.mjs`: HTTP Node nativo, endpoints e limite local.
- `docs/`: plano comercial, prompts e especificação de evolução.
- `.env.example`: configuração sem segredos.

A entrega tem zero dependências de produção. O projeto cub4Studio de referência não foi alterado. Não há integração de pagamento, autenticação, banco multiusuário, eventos publicitários ou implantação pública nesta versão. A marca pode ser substituída editando HTML/CSS e `brand.png`; não há cessão automática dos direitos da marca a um comprador do software.

## Antes de vender acesso público

Implementar autenticação, autorização por workspace, persistência de jobs/cache/créditos em banco transacional, quotas atômicas e idempotência, controle de abuso, observabilidade, política de retenção/exclusão, onboarding e cobrança com webhooks validados. Bloquear qualquer execução sem entitlement. Não expor esta versão local com uma chave ativa à internet. A campanha de venda de desenvolvimento pode usar a demonstração rotulada; a campanha de assinatura depende da conclusão desses requisitos e de buscas reais verificadas.

## Empacotar para comprador

Entregar código, documentação, inventário de assets e instruções de instalação. Excluir `.env`, `.data`, dados de clientes, cookies, tokens, node_modules e históricos locais. O comprador cria suas próprias contas de provedor e pagamentos. Definir em contrato escopo, direitos de código, suporte, marcas e licenças; não transferir uma conta pessoal com credenciais.
