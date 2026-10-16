# Livraria digital — integração pendente (Codex + Mercado Pago)
Status: IMPLEMENTAÇÃO DE BASE SALVA; **NÃO ESTÁ PUBLICADA COMO CHECKOUT FUNCIONAL**.

## O que já existe
- `ebook-delivery/worker.js`: API Cloudflare Workers para criar pedidos e preferências de checkout, verificar webhook, consultar pedido e entregar EPUB privado. Recusa pedidos não habilitados.
- `ebook-delivery/schema.sql`: armazenamento D1 de pedidos e estados.
- `ebook-delivery/wrangler.toml`: modelo das vinculações R2/D1, IDs reais pendentes.
- `ebook-delivery/checkout-client.js`: cadastro mínimo de e-mail e redirecionamento a checkout, preparado, mas NÃO injetado na página pública.
- `livros/compra/index.html`: retorno após pagamento e recuperação por e-mail + número do pagamento; requer `window.EBOOK_DELIVERY_API` configurado.
- `purchase-links.js`: todos os destinos estão vazios e os botões públicos estão desativados. **Não ativar antes dos testes completos e da aprovação de Fabiano.**
- `ebook-delivery/worker.test.mjs`: testes locais do fluxo seguro sem cobrança real.

## Funcionamento
1. Comprador escolhe EPUB e informa seu e-mail.
2. Worker cria pedido D1 com token secreto temporário na sessão do navegador; não manda token para MP.
3. Worker cria preferência de pagamento no Mercado Pago usando credencial em segredo do Worker, nunca no site.
4. MP envia webhook assinado; Worker valida HMAC, consulta a API MP e confere pedido, metadado, valor, moeda, ambiente e conta recebedora.
5. Apenas pagamento aprovado habilita o POST de download, que lê o objeto R2 privado e entrega EPUB por resposta com no-store.
6. Limites: 10 downloads em até 30 dias por pedido; estorno/rejeição desativa acesso.
7. Se a sessão for perdida, o comprador pode recuperar o pedido com o e-mail original e o número do pagamento; o token anterior é revogado.

## Requisitos para Codex completar e implantar
- Na **conta pessoal** Cloudflare adequada: criar bucket R2 privado `fabiano-ebooks-private`, banco D1 `fabiano-ebook-orders` e Worker `fabiano-ebook-delivery`. Não habilitar domínio público do bucket e não publicar EPUBs no GitHub.
- Ajustar `wrangler.toml` com ID D1 e URL HTTPS real do Worker. Executar o schema SQL no D1 remoto.
- Definir segredos `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_COLLECTOR_ID`, `RATE_LIMIT_SALT` e `CLAIM_SECRET` no Worker via `wrangler secret put`, nunca no repositório.
- Conferir contratos e exclusividade dos títulos; comparar títulos, formatos e preços aprovados pelo autor com o catálogo definido no Worker.
- Adicionar os EPUBs **oficiais finais** no R2 como objetos nomeados conforme `CATALOG`. Conferir integridade (hash/EPUBCheck) e remover capítulos de referências conforme revisão editorial aprovada antes de publicar.
- Preencher `ENABLED_BOOKS` apenas para os títulos cujo EPUB final e venda direta estejam liberados.
- Configurar webhook `https://URL_DO_WORKER/api/mp-webhook` no Painel Mercado Pago em Produção, evento **Pagamentos**; validar assinatura x-signature.
- Inserir `window.EBOOK_DELIVERY_API='https://URL_DO_WORKER'` nas páginas de compra **e de retorno**. Incluir `checkout-client.js` depois de desabilitar as chamadas antigas de `purchase-links.js`, evitando duplo fluxo.
- Atenção: os botões atuais usam atributo `data-ebook-buy`; devem ter comportamento único, não manter pagamento estático e Worker ativo ao mesmo tempo.
- Preparar política de privacidade e, se aprovado, e-mail transacional. A recuperação sem e-mail automático já está implementada; **o EPUB não é anexado nem exposto por link público**.
- Testar integralmente em ambiente de homologação: pagamento aprovado, Pix pendente e posterior confirmação, cartão recusado, estorno, assinatura webhook adulterada, divergência de preço, pedido sem token, erro de arquivo, retorno em outro navegador, dois webhooks repetidos, limite de download, dispositivos móveis, HTTPS e conformidade LGPD.
- Após testes, ativar um título-piloto e verificar uma compra real antes de migrar todo o catálogo. O titular deve aprovar os testes e a publicação.
- **Não habilitar links de download diretos/publicamente acessíveis**; os links atuais Mercado Pago não garantem entrega.

## Questões em aberto
- Autenticar a conta pessoal Cloudflare e confirmar que os recursos ficarão no plano gratuito.
- Obter as credenciais de teste de uma aplicação Mercado Pago e confirmar o `collector_id` da conta pessoal; nenhuma credencial deve entrar no GitHub.
- Conferir os EPUBs finais, preços e títulos válidos para venda direta.
- Corrigir o CNAME de `www`: atualmente aponta para o domínio raiz e falha no certificado HTTPS; deve apontar diretamente para `FBC915320.github.io`.
- Verificar que os valores configurados no Worker correspondem às ofertas públicas.

## Auditoria editorial e operacional — 16/10/2026

**Escopo:** estes estados se referem exclusivamente à habilitação da venda direta no site, não à aprovação literária, à integridade do manuscrito-mestre ou à distribuição já existente dos livros. Os títulos abaixo são os títulos oficiais em português; caso sejam exibidos com palavras diferentes, verifique se a tradução automática do navegador está ativada.


| Livro | Arquivos identificados no Google Drive | Pendência para habilitar a venda direta |
| --- | --- | --- |
| A Estratégia do Invisível | Dois EPUBs de 15/10/2026, 10.987.678 e 9.736.508 bytes, hashes distintos e o mesmo UUID; estrutura ZIP válida | Bloqueado: definir o canônico e corrigir metadados de título/idioma |
| Posicione-se e Vença pela Fé | EPUB da pasta FINAL, 9.898.636 bytes, SHA-256 `7d32cb9f…6473b3`; estrutura, sumário e recursos íntegros | Bloqueado: metadado sem autor e com três idiomas; confirmar versão e direitos de venda direta |
| Corolla Cross Hybrid — 13 Problemas | EPUB completo na pasta “06 - Edição final para publicação”, 5.199.894 bytes, SHA-256 `86cc8dd2…3b79b`; estrutura, sumário e recursos íntegros | Bloqueado: metadado sem autor; confirmar versão e direitos de venda direta |
| Quando o Dia Termina | Três cópias de plataforma idênticas, 1.195.175 bytes, SHA-256 `54f04cd5…fc84`; estrutura válida | Bloqueado: o capítulo 09 “Referências e alcance da obra” ainda está presente |
| Guia Prático BMP Advanced | Arquivos editáveis e PDF presentes na pasta do projeto; EPUB final comercial ainda não localizado nesta checagem | Pendente: localizar e validar a edição EPUB definitiva |
| Coleção Aprenda IA (volumes 1–5) | Cinco EPUBs localizados e aprovados na verificação estrutural básica; títulos, autor, idioma, sumário e recursos internos coerentes | Bloqueado comercialmente: faltam preços aprovados e autorização explícita de venda direta |

O site GitHub já contém capas para os títulos listados. Preservar capas originais, sem gerar capas substitutas para obras aprovadas.

**Segurança testada localmente:** 26 testes automatizados passaram para origem/CORS, livro desabilitado, arquivo ausente, checkout de homologação, idempotência, assinatura e tipo de webhook, preço divergente, recebedor divergente, ambiente divergente, aprovação, Pix pendente e posterior confirmação, cartão recusado, cancelamento, webhook repetido, notificação pendente fora de ordem, estorno, token ausente, limite de download, falha de arquivo, expiração, recuperação com renovação de prazo e rejeição de e-mail diferente, compras simultâneas e preflight. O e-mail é persistido no D1 somente como HMAC não reversível e não fica no armazenamento de sessão do navegador. Ainda faltam os testes reais no ambiente de homologação do Mercado Pago e na infraestrutura Cloudflare.

**Estado de serviço:** nenhum bucket R2, D1 ou Worker em produção foi criado por esta sessão; não há credenciais Mercado Pago disponíveis. O repositório contém componentes e modelo de configuração apenas, não confirmações de implantação.

**Estado dos links:** referências estáticas de pagamento foram desativadas no `purchase-links.js` como medida de proteção. Após deploy efetivo e validação de uma venda com entrega de EPUB, o Codex poderá ligar os botões ao checkout seguro. Evitar links de pagamento sem fulfillment.

**Custo esperado no plano gratuito, a confirmar na conta antes de criar recursos:** Workers Free inclui 100.000 requisições/dia; D1 Free inclui 5 milhões de linhas lidas/dia, 100.000 escritas/dia e 5 GB; R2 Standard inclui 10 GB-mês, 1 milhão de operações Classe A e 10 milhões Classe B por mês, com egress gratuito. A implantação não deve prosseguir se o painel indicar contratação, cartão obrigatório ou cobrança.

## Reforço de segurança

A verificação de webhooks deve rejeitar pagamentos atribuídos a outra conta, outro ID de pagamento ou a um pedido vinculado a outro pagamento. O segredo `MP_COLLECTOR_ID` é obrigatório para impedir liberação por comprovantes de recebedores não autorizados. Confirmar seu valor no painel Mercado Pago antes de implantar, sem registrá-lo no GitHub.
