# Quando o dia termina — prévia comercial local

Abrir: duplo clique em `index.html` (ou `python3 -m http.server` nesta pasta).

- Novo lançamento: copiar a pasta, editar `livro.js` e trocar os arquivos de `assets/`.
- `assets/amostra.mp3`: narração sintética; só na prévia local até validação comercial.
- Preços/links: vazios = botão desabilitado. Nada foi publicado.
- Integração: enviar esta pasta para `/livros/quando-o-dia-termina/` (hospedagem estática).

## Integração (não executada)
- Enviar `index.html`, `livro.js`, `assets/` para `/livros/quando-o-dia-termina/` (hospedagem estática).
- Metatags og:image/og:url já apontam para o endereço previsto; ajustar se o caminho final mudar.
- Antes de publicar: confirmar amostra de áudio, preencher links em `livro.js`, testar no celular.
- Não remover a implantação antiga do Cloudflare até a nova estar no ar e validada.
