(() => {
  'use strict';
  const root = document.querySelector('[data-central-root]') || document;
  const search = root.querySelector('[data-search]');
  const fold = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const matches = (text, query) => fold(query).trim().split(/\s+/).filter(Boolean).every(token => fold(text).includes(token));
  if (search) {
    const cards = [...root.querySelectorAll('[data-manual-card]')];
    const buttons = [...root.querySelectorAll('[data-category]')];
    const result = root.querySelector('[data-result-count]');
    const title = root.querySelector('[data-results-title]');
    const empty = root.querySelector('[data-empty]');
    const clear = root.querySelector('[data-clear-search]');
    let active = 'Todos';
    const update = () => {
      let count = 0;
      cards.forEach(card => {
        const visible = (active === 'Todos' || card.dataset.manualCategory === active) && matches(card.dataset.searchText, search.value);
        card.hidden = !visible;
        if (visible) count++;
      });
      result.textContent = `${count} ${count === 1 ? 'manual disponível' : 'manuais disponíveis'}`;
      title.textContent = active === 'Todos' ? 'Todos os manuais' : active;
      empty.hidden = count !== 0;
      clear.hidden = search.value.length === 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      active = button.dataset.category;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      update();
    }));
    search.addEventListener('input', update);
    clear.addEventListener('click', () => {search.value = ''; update(); search.focus();});
    root.querySelector('[data-reset]')?.addEventListener('click', () => {
      search.value = ''; active = 'Todos'; buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === 'Todos'))); update(); search.focus();
    });
    update();
  }
  globalThis.CikalaSearch = Object.freeze({fold, matches});
})();
