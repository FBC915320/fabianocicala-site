(function(){
 var b=document.querySelector('.burger'),m=document.getElementById('menu');
 if(b&&m){b.addEventListener('click',function(){
  var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}

 var items=document.querySelectorAll('.pil,.book,.art,.head-row,.video-in');
 if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(x){
   if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.12});
  items.forEach(function(el){el.classList.add('rv');io.observe(el);});
 }

 var list=document.getElementById('lista');
 if(list){
  var q=document.getElementById('q'),n=document.getElementById('n'),v=document.getElementById('vazio');
  var cat='',cards=[].slice.call(list.querySelectorAll('.book'));
  function run(){
   var t=(q.value||'').trim().toLowerCase(),c=0;
   cards.forEach(function(el){
    var ok=(!cat||el.dataset.cat===cat)&&(!t||el.dataset.t.indexOf(t)>-1);
    el.hidden=!ok;if(ok)c++;});
   n.textContent=c;v.hidden=c>0;}
  q.addEventListener('input',run);
  document.querySelectorAll('.f').forEach(function(f){f.addEventListener('click',function(){
   document.querySelectorAll('.f').forEach(function(x){x.classList.remove('on');});
   f.classList.add('on');cat=f.dataset.c;run();});});
 }
})();

/* vídeos do YouTube: só carrega o player ao clicar (modo de privacidade aprimorada) */
document.querySelectorAll('.vid .yt').forEach(function(b){
  b.addEventListener('click',function(){
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+b.dataset.id+'?autoplay=1&rel=0';
    f.title=b.getAttribute('aria-label')||'Vídeo';
    f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen','');
    f.loading='lazy';
    b.replaceWith(f);
  });
});
