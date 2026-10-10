(function () {
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = '/catalog.css?v=20261010a';
  document.head.append(styles);

  const section = document.querySelector('#livros');
  const grid = section?.querySelector('.books-grid');
  const lang = document.documentElement.lang.toLowerCase();
  if (!section || !grid || !['pt-br', 'en'].includes(lang)) return;

  const isEnglish = lang === 'en';
  const appleAuthorUrl = 'https://books.apple.com/br/artist/fabiano-cicala/6817624282';
  const labels = isEnglish ? {
    eyebrow: 'Official publications', title: 'Books born from real experience.',
    intro: 'Explore the available e-books, read a preview and buy securely from the official store.',
    available: 'Available', upcoming: 'In preparation', guide: 'Technical guide',
    preview: 'Read preview', buy: 'Buy on Apple Books', details: 'Learn more', close: 'Close',
    price: 'Price on Apple Books', store: 'View all books on Apple Books', projects: 'Next publication',
    projectsIntro: 'Work currently in editorial preparation. Purchase links will be added only after official release.'
  } : {
    eyebrow: 'Publicações oficiais', title: 'Livros que nasceram da experiência real.',
    intro: 'Conheça os e-books disponíveis, leia uma prévia e compre com segurança na loja oficial.',
    available: 'Disponível', upcoming: 'Em preparação', guide: 'Guia técnico',
    preview: 'Ler prévia', buy: 'Comprar no Apple Books', details: 'Saiba mais', close: 'Fechar',
    price: 'Preço no Apple Books', store: 'Ver todos os livros no Apple Books', projects: 'Próxima publicação',
    projectsIntro: 'Obra em preparação editorial. O link de compra será incluído somente após a publicação oficial.'
  };

  const books = [
    {
      id: 'estrategia', title: isEnglish ? 'The Invisible Strategy' : 'A Estratégia do Invisível',
      subtitle: isEnglish ? 'Leadership, Faith and Purpose in Silent Command' : 'Liderança, Fé e Propósito no Comando Silencioso',
      cover: '/capa-estrategia-invisivel-frente.webp', backCover: '/capa-estrategia-invisivel-verso.webp', price: 'R$ 24,90',
      url: 'https://books.apple.com/br/book/a-estrat%C3%A9gia-do-invis%C3%ADvel/id6820215202',
      description: isEnglish
        ? 'Fabiano Cicala shares a journey shaped by work, new beginnings, faith and responsibility. Rather than offering easy formulas, the book explores what precedes every important decision: silence, character, service, discipline and the courage to act when no one is watching.'
        : 'Fabiano Cicala compartilha uma trajetória construída entre trabalho, recomeços, fé e responsabilidade. Mais do que relatar conquistas, convida o leitor a perceber aquilo que antecede toda decisão importante: o silêncio, o caráter, o serviço, a disciplina e a coragem de agir quando ninguém está olhando. Um chamado para liderar com responsabilidade, servir pessoas e construir algo que permaneça.'
    },
    {
      id: 'posicione', title: isEnglish ? 'Position Yourself and Win by Faith' : 'Posicione-se e Vença pela Fé',
      subtitle: isEnglish ? 'Prayers and Biblical Principles for Spiritual Battles' : 'Orações e Princípios Bíblicos para Batalhas Espirituais',
      cover: '/capa-posicione-se-venca-pela-fe.webp', price: 'R$ 14,90',
      url: 'https://books.apple.com/br/book/posicione-se-e-ven%C3%A7a-pela-f%C3%A9/id6820549926',
      description: isEnglish
        ? 'A practical guide for readers who want to strengthen their faith, develop a life of prayer and learn how to take a spiritual stand in difficult moments. It brings prayers, biblical references and reflections on protection, family, wisdom, healing, purpose and perseverance.'
        : 'Um guia prático para quem deseja fortalecer a fé, desenvolver uma vida de oração e aprender a se posicionar espiritualmente diante das dificuldades. Reúne orações, referências bíblicas e ensinamentos sobre proteção, família, sabedoria, cura, libertação, propósito e perseverança. Mais do que repetir palavras, é um convite para transformar conhecimento em atitude.'
    },
    {
      id: 'corolla', title: isEnglish ? 'Corolla Cross Hybrid + 13 Problems' : 'Corolla Cross Hybrid + 13 Problemas',
      subtitle: isEnglish ? 'A Brazilian owner’s real-world account' : 'Relato real de um proprietário no Brasil',
      cover: '/capa-corolla-cross-13-problemas.jpg', price: 'R$ 9,90',
      url: 'https://books.apple.com/br/book/corolla-cross-hybrid-13-problemas/id6817624270',
      description: isEnglish
        ? 'A personal and critical account of owning a brand-new Corolla Cross Hybrid in Brazil. Across thirteen points, Fabiano Cicala describes everyday issues, disappointing design decisions and his experience with after-sales service.'
        : 'Um relato pessoal e crítico sobre a experiência de comprar e usar um Corolla Cross Hybrid zero-quilômetro no Brasil. Em treze pontos, Fabiano Cicala apresenta problemas vividos no cotidiano, decisões de projeto que o decepcionaram e sua experiência com o atendimento pós-venda.'
    },
    {
      id: 'solar', title: isEnglish ? 'Practical Guide to the Solar Controller' : 'Guia Prático do Controlador Solar',
      subtitle: isEnglish ? 'BMP Advanced for boilers and solar heaters' : 'BMP Advanced para boiler e aquecedor solar',
      cover: '/capa-guia-controlador-solar.webp', status: labels.guide,
      description: isEnglish
        ? 'A practical reference for understanding and operating the BMP Advanced controller used in boiler and solar-heating systems.'
        : 'Referência prática para compreender e operar o controlador BMP Advanced utilizado em sistemas de boiler e aquecimento solar.'
    }
  ];

  const card = (book) => `
    <article class="book-card book-card--enhanced">
      <button class="book-cover book-preview-cover" type="button" data-book="${book.id}" aria-label="${labels.preview}: ${book.title}">
        ${book.backCover ? `<img class="book-back" src="${book.backCover}" alt="" loading="lazy">` : ''}
        <img class="book-front" src="${book.cover}" alt="${book.title}" loading="lazy">
        <span class="book-cover-action">${labels.preview}</span>
      </button>
      <div class="book-info">
        <span class="book-status">${book.status || labels.available}</span>
        <h3>${book.title}</h3><p class="book-subtitle">${book.subtitle}</p>
        ${book.price ? `<p class="book-price">${book.price}</p>` : ''}
        <div class="book-actions">
          <button class="book-preview-button" type="button" data-book="${book.id}">${book.url ? labels.preview : labels.details}</button>
          ${book.url ? `<a class="book-buy-button" href="${book.url}" target="_blank" rel="noopener">${labels.buy}<span aria-hidden="true">↗</span></a>` : ''}
        </div>
      </div>
    </article>`;

  section.querySelector('.head').outerHTML = `<div class="books-heading"><div><div class="kicker">${labels.eyebrow}</div><h2>${labels.title}</h2><p>${labels.intro}</p></div><a class="store-link" href="${appleAuthorUrl}" target="_blank" rel="noopener">${labels.store}<span aria-hidden="true">↗</span></a></div>`;
  grid.innerHTML = books.map(card).join('');
  grid.insertAdjacentHTML('afterend', `<aside class="upcoming-book" aria-label="${labels.projects}"><img src="/capa-caminho-esperanca.png" alt="A Caminho da Esperança" loading="lazy"><div><span class="book-status">${labels.upcoming}</span><h3>A Caminho da Esperança</h3><p>${labels.projectsIntro}</p></div></aside>`);

  const dialog = document.createElement('dialog');
  dialog.className = 'book-dialog';
  dialog.innerHTML = '<div class="book-dialog-content"></div>';
  document.body.append(dialog);

  function openPreview(id) {
    const book = books.find((item) => item.id === id);
    if (!book) return;
    dialog.querySelector('.book-dialog-content').innerHTML = `<button class="dialog-close" type="button" aria-label="${labels.close}">×</button><img src="${book.cover}" alt="${book.title}"><div><span class="book-status">${book.status || labels.available}</span><h2>${book.title}</h2><p class="dialog-subtitle">${book.subtitle}</p><p>${book.description}</p>${book.price ? `<p class="dialog-price"><strong>${labels.price}:</strong> ${book.price}</p>` : ''}${book.url ? `<a class="book-buy-button" href="${book.url}" target="_blank" rel="noopener">${labels.buy}<span aria-hidden="true">↗</span></a>` : ''}</div>`;
    dialog.showModal();
    dialog.querySelector('.dialog-close').focus();
  }

  document.querySelectorAll('[data-book]').forEach((button) => button.addEventListener('click', () => openPreview(button.dataset.book)));
  dialog.addEventListener('click', (event) => { if (event.target === dialog || event.target.closest('.dialog-close')) dialog.close(); });

  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Person', name: 'Fabiano Cicala', url: 'https://fabianocicala.com',
    sameAs: ['https://www.instagram.com/fabianocicala1/', 'https://www.linkedin.com/in/fabiano-cicala-71ba82364/', appleAuthorUrl],
    author: books.filter((book) => book.url).map((book) => ({
      '@type': 'Book', name: book.title, url: book.url, image: `https://fabianocicala.com${book.cover}`,
      offers: { '@type': 'Offer', priceCurrency: 'BRL', price: book.price.replace('R$ ', '').replace(',', '.') }
    }))
  });
  document.head.append(schema);
})();
