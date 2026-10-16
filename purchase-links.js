(function () {
  'use strict';

  /*
   * Segurança da livraria digital:
   * links isolados de pagamento NÃO comprovam que o EPUB será entregue.
   * Só o fluxo Worker + webhook validado + R2 privado poderá habilitar compras.
   * Os links Mercado Pago anteriores foram desativados da vitrine até os testes.
   * A integração do Codex deverá substituir este arquivo após homologação.
   */
  const links = Object.freeze({
    'a-estrategia-do-invisivel': '',
    'posicione-se-e-venca-pela-fe': '',
    'corolla-cross-hybrid-13-problemas': '',
    'quando-o-dia-termina': '',
    'guia-pratico-controlador-solar': ''
  });

  const language = (document.documentElement.lang || 'pt-BR').toLowerCase();
  const copy = language.startsWith('en')
    ? { pending: 'Secure checkout in preparation' }
    : language.startsWith('es')
      ? { pending: 'Compra segura en preparación' }
      : language.startsWith('it')
        ? { pending: 'Acquisto sicuro in preparazione' }
        : { pending: 'Compra segura em preparação' };

  const style = document.createElement('style');
  style.textContent = '[data-ebook-buy].is-disabled{opacity:.7;cursor:not-allowed;pointer-events:none;filter:saturate(.6)}';
  document.head.appendChild(style);

  function applyPurchaseLinks(root) {
    root.querySelectorAll('[data-ebook-buy]').forEach(function (button) {
      button.removeAttribute('href');
      button.removeAttribute('target');
      button.removeAttribute('rel');
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('tabindex', '-1');
      button.classList.add('is-disabled');
      button.textContent = copy.pending;
    });
  }

  window.EBOOK_PURCHASE_LINKS = links;
  window.applyEbookPurchaseLinks = applyPurchaseLinks;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyPurchaseLinks(document); });
  } else {
    applyPurchaseLinks(document);
  }
})();
