(function(){
 const top=document.querySelector('.top');
 const button=document.querySelector('.mobile-menu-toggle');
 const nav=document.getElementById('primary-navigation');
 if(!top||!button||!nav)return;
 top.classList.add('mobile-nav-ready');
 const close=()=>{nav.classList.remove('is-open');button.setAttribute('aria-expanded','false');};
 button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){close();button.focus();}});
})();
