# Livraria digital — integração pendente (Codex + Mercado Pago)
Status: IMPLEMENTAÇÃO DE BASE SALVA; **NÃO ESTÁ PUBLICADA COMO CHECKOUT FUNCIONAL**.

## O que já existe
- `ebook-delivery/worker.js`: API Cloudflare Workers para criar pedidos e preferências de checkout, verificar webhook, consultar pedido e entregar EPUB privado. Recusa pedidos não habilitados.
- `ebook-delivery/schema.sql`: armazenamento D1 de pedidos e estados.
- `ebook-delivery/wrangler.toml`: modelo das vinculações R2/D1, IDs reais pendentes.
- `ebook-delivery/checkout-client.js`: cadastro mínimo de e-mail e redirecionamento a checkout, preparado, mas NÃO injetado na página pública.
- `livros/compra/index.html`: retorno após pagamento; requer `window.EBOOK_DELIVERY_API` configurado, sessão original e webhook validado.
- `purchase-links.js`: links Mercado Pago atuais. **Não trocar/ativar fluxo novo antes dos testes.**

## Funcionamento
1. Comprador escolhe EPUB e informa seu e-mail.
2. Worker cria pedido D1 com token secreto temporário na sessão do navegador; não manda token para MP.
3. Worker cria preferência de pagamento no Mercado Pago usando credencial em segredo do Worker, nunca no site.
4. MP envia webhook assinado; Worker valida HMAC, consulta API MP e confere pedido, valor e moeda.
5. Apenas pagamento aprovado habilita o POST de download, que lê o objeto R2 privado e entrega EPUB por resposta com no-store.
6. Limites previstos: 10 downloads em até 30 dias por pedido; estorno/rejeição desativa acesso.

## Requisitos para Codex completar e implantar
- Na **conta pessoal** Cloudflare adequada: criar bucket R2 privado `fabiano-ebooks-private`, banco D1 `fabiano-ebook-orders` e Worker `fabiano-ebook-delivery`. Não habilitar domínio público do bucket e não publicar EPUBs no GitHub.
- Ajustar `wrangler.toml` com ID D1 e URL HTTPS real do Worker. Executar o schema SQL no D1 remoto.
- Definir segredos `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` no Worker via `wrangler secret put`, nunca no repositório.
- Conferir contratos e exclusividade dos títulos; comparar títulos, formatos e preços aprovados pelo autor com o catálogo definido no Worker.
- Adicionar os EPUBs **oficiais finais** no R2 como objetos nomeados conforme `CATALOG`. Conferir integridade (hash/EPUBCheck) e remover capítulos de referências conforme revisão editorial aprovada antes de publicar.
- Preencher `ENABLED_BOOKS` apenas para os títulos cujo EPUB final e venda direta estejam liberados.
- Configurar webhook `https://URL_DO_WORKER/api/mp-webhook` no Painel Mercado Pago em Produção, evento **Pagamentos**; validar assinatura x-signature.
- Inserir `window.EBOOK_DELIVERY_API='https://URL_DO_WORKER'` nas páginas de compra **e de retorno**. Incluir `checkout-client.js` depois de desabilitar as chamadas antigas de `purchase-links.js`, evitando duplo fluxo.
- Atenção: os botões atuais usam atributo `data-ebook-buy`; devem ter comportamento único, não manter pagamento estático e Worker ativo ao mesmo tempo.
- Preparar e-mail transacional (serviço de envio validado e consentido), recuperação de acesso e política de privacidade. A versão-base libera pela sessão do comprador; **ainda não envia EPUB por e-mail**.
- Testar integralmente em ambiente de homologação: pagamento aprovado, Pix pendente e posterior confirmação, cartão recusado, estorno, assinatura webhook adulterada, divergência de preço, pedido sem token, erro de arquivo, retorno em outro navegador, dois webhooks repetidos, limite de download, dispositivos móveis, HTTPS e conformidade LGPD.
- Após testes, ativar um título-piloto e verificar uma compra real antes de migrar todo o catálogo. O titular deve aprovar os testes e a publicação.
- **Não habilitar links de download diretos/publicamente acessíveis**; os links atuais Mercado Pago não garantem entrega.

## Questões em aberto
- Identificar conta de titularidade Cloudflare/Mercado Pago que Codex está configurando.
- Escolher meio de envio de recibo e recuperação do pedido.
- Conferir os EPUBs finais, preços e títulos válidos para venda direta.
- Validar hospedagem do site (implantação GitHub/Cloudflare), CORS e domínio HTTPS.
- Verificar que os valores configurados no Worker correspondem às ofertas públicas.
