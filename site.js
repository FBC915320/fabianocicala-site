const toggle = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
toggle?.addEventListener('click',()=>{
 const open=nav.classList.toggle('is-open');
 toggle.setAttribute('aria-expanded',String(open));
});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
 nav.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');
}));
const search=document.querySelector('#book-search');
search?.addEventListener('input',()=>{
 let shown=0;const query=search.value.toLocaleLowerCase('pt-BR').trim();
 document.querySelectorAll('.catalog-grid .book-card').forEach(card=>{
  const match=card.textContent.toLocaleLowerCase('pt-BR').includes(query);
  card.hidden=!match;if(match)shown++;
 });
 document.querySelector('#no-results').hidden=shown!==0;
});
