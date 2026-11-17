/* Navegação unificada nas páginas legadas do site pessoal. */
(()=>{"use strict";
const body=document.body;
if(!body||!body.classList.contains("fc-modern-page")||document.querySelector(".fc-unified-top"))return;
const path=location.pathname;
const lang=path.startsWith("/it/")?"it":path.startsWith("/en/")?"en":path.startsWith("/es/")?"es":"pt";
const labels={pt:["Início","Sobre","Livros","Conexões","Conteúdos"],en:["Home","About","Books","Connections","Articles"],it:["Inizio","Chi sono","Libri","Connessioni","Articoli"],es:["Inicio","Sobre mí","Libros","Conexiones","Artículos"]}[lang];
const home=lang==="pt"?"/":"/"+lang+"/";
const about=lang==="en"?"/en/about/":lang==="it"?"/it/sobre/":"/sobre/";
const existing=document.querySelector(".top .nav");
if(existing){existing.innerHTML=[[home,labels[0]],[about,labels[1]],["/livros/",labels[2]],["/conexoes/",labels[3]],["/conteudos/",labels[4]]].map(([url,label])=>'<a href="'+url+'">'+label+"</a>").join("")+'<div class="langs" role="navigation" aria-label="Idioma"><a href="/">PT</a><a href="/it/">IT</a><a href="/en/">EN</a></div>';return;}
const nav=document.createElement("div");nav.className="fc-unified-top";
const links=[[home,labels[0]],[about,labels[1]],["/livros/",labels[2]],["/conexoes/",labels[3]],["/conteudos/",labels[4]]];
const current=path.replace(/index\.html$/,"");
nav.innerHTML='<a class="fc-unified-brand" href="'+home+'"><img src="/favicon.svg" alt="FC" width="36" height="36"><span>Fabiano Cicala</span></a><button class="fc-unified-toggle" type="button" aria-controls="fc-unified-links" aria-expanded="false">Menu</button><nav id="fc-unified-links" class="fc-unified-links" aria-label="Navegação principal">'+links.map(([url,label])=>'<a href="'+url+'"'+(current===url?' aria-current="page"':'')+'>'+label+'</a>').join("")+'<span class="fc-unified-languages"><a href="/" lang="pt-BR">PT</a><a href="/it/" lang="it">IT</a><a href="/en/" lang="en">EN</a></span></nav>';
body.insertBefore(nav,body.firstChild);
const toggle=nav.querySelector("button");toggle.addEventListener("click",()=>{const open=nav.classList.toggle("is-open");toggle.setAttribute("aria-expanded",String(open))});
})();