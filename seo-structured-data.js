/* Dados estruturados complementares do fabianocicala.com. */
(function () {
  'use strict';
  var base = 'https://fabianocicala.com';
  var path = window.location.pathname.replace(/\/index\.html$/, '/');
  var title = document.querySelector('h1');
  var name = title ? title.textContent.replace(/\s+/g, ' ').trim() : document.title.split('|')[0].trim();
  function hasType(type) {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some(function (script) {
      return script.textContent.indexOf('"@type":"' + type + '"') !== -1 || script.textContent.indexOf('"@type": "' + type + '"') !== -1;
    });
  }
  function add(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
  if (path === '/' && !hasType('WebSite')) {
    add({
      '@context':'https://schema.org',
      '@type':'WebSite',
      '@id':base + '/#website',
      name:'Fabiano Cicala',
      url:base + '/',
      inLanguage:'pt-BR',
      publisher:{'@id':base + '/#autor'}
    });
  }
  if ((path === '/livros/' || path === '/conteudos/') && !hasType('CollectionPage')) {
    add({
      '@context':'https://schema.org',
      '@type':'CollectionPage',
      name:name,
      url:base + path,
      inLanguage:'pt-BR',
      isPartOf:{'@id':base + '/#website'},
      author:{'@id':base + '/#autor'}
    });
  }
  var detail = path.match(/^\/(livros|conteudos)\/[^/]+\/$/);
  if (detail && !hasType('BreadcrumbList')) {
    var section = detail[1];
    var sectionName = section === 'livros' ? 'Livros' : 'Conteúdos';
    add({
      '@context':'https://schema.org',
      '@type':'BreadcrumbList',
      itemListElement:[
        {'@type':'ListItem',position:1,name:'Início',item:base + '/'},
        {'@type':'ListItem',position:2,name:sectionName,item:base + '/' + section + '/'},
        {'@type':'ListItem',position:3,name:name,item:base + path}
      ]
    });
  }
})();
