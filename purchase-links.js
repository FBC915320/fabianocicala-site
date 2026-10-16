(function () {
  'use strict';

  // Fonte unica dos destinos de compra. Um valor vazio mantem o botao
  // visivel, mas desativado, ate o link de pagamento ser confirmado.
  const links = Object.freeze({
    'a-estrategia-do-invisivel': 'https://mpago.la/27F27iG',
    'posicione-se-e-venca-pela-fe': 'https://mpago.la/2Z1AG7t',
    'corolla-cross-hybrid-13-problemas': 'https://mpago.la/1WVtNE5',
    'quando-o-dia-termina': 'https://mpago.la/2MwCnp3',
    'guia-pratico-controlador-solar': ''
  });

  const language = (document.documentElement.lang || 'pt-BR').toLowerCase();
  const copy = language.startsWith('en')
    ? { active: 'Buy e-book', pending: 'Direct purchase coming soon' }
    : language.startsWith('es')
      ? { active: 'Comprar e-book', pending: 'Compra directa próximamente' }
      : language.startsWith('it')
        ? { active: 'Acquista e-book', pending: 'Acquisto diretto prossimamente' }
        : { active: 'Comprar e-book', pending: 'Compra direta em breve' };

  const style = document.createElement('style');
  style.textContent = '[data-ebook-buy].is-disabled{opacity:.58;cursor:not-allowed;pointer-events:none;filter:saturate(.55)}';
  document.head.appendChild(style);

  function applyPurchaseLinks(root) {
    root.querySelectorAll('[data-ebook-buy]').forEach(function (button) {
      const href = links[button.dataset.ebookBuy];
      if (href) {
        button.href = href;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.removeAttribute('aria-disabled');
        button.removeAttribute('tabindex');
        button.classList.remove('is-disabled');
        button.textContent = copy.active;
      } else {
        button.removeAttribute('href');
        button.removeAttribute('target');
        button.removeAttribute('rel');
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('tabindex', '-1');
        button.classList.add('is-disabled');
        button.textContent = copy.pending;
      }
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
