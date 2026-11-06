#!/usr/bin/env python3
"""Aplica apenas correções técnicas de SEO em páginas pessoais autorizadas."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if old not in text:
        if new in text:
            return
        raise RuntimeError(f"Trecho esperado não encontrado em {path}: {old[:80]}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def ensure_before(path: str, marker: str, insertion: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if insertion in text:
        return
    if marker not in text:
        raise RuntimeError(f"Marcador não encontrado em {path}: {marker}")
    file.write_text(text.replace(marker, insertion + marker, 1), encoding="utf-8")


for page in (
    "en/about/index.html",
    "en/index.html",
    "it/index.html",
    "it/sobre/index.html",
    "sobre/index.html",
):
    file = ROOT / page
    text = file.read_text(encoding="utf-8")
    file.write_text(text.replace("https://www.youtube.com/@FabianoCicala", "https://www.youtube.com/@fabianocicala1"), encoding="utf-8")

for page in (
    "livros/corolla-cross-hybrid-13-problemas/index.html",
    "livros/guia-pratico-controlador-solar/index.html",
):
    file = ROOT / page
    text = file.read_text(encoding="utf-8")
    text = re.sub(r'<meta name="robots" content="[^"]+">', '', text)
    text = text.replace("</head>", '<meta name="robots" content="noindex,follow"></head>', 1)
    file.write_text(text, encoding="utf-8")

replace_once(
    "index.html",
    '<link rel="canonical" href="https://fabianocicala.com">',
    '<link rel="canonical" href="https://fabianocicala.com/">',
)
replace_once(
    "index.html",
    '<meta property="og:url" content="https://fabianocicala.com">',
    '<meta property="og:url" content="https://fabianocicala.com/">',
)

contents_meta = (
    '<link rel="canonical" href="https://fabianocicala.com/conteudos/">'
    '<meta name="robots" content="index,follow,max-image-preview:large">'
    '<meta property="og:type" content="website">'
    '<meta property="og:title" content="Conteúdos — Artigos, livros e vídeos | Fabiano Cicala">'
    '<meta property="og:description" content="Artigos autorais, livros e vídeos sobre negócios, tecnologia, liderança, inteligência artificial e experiências reais.">'
    '<meta property="og:url" content="https://fabianocicala.com/conteudos/">'
    '<meta property="og:image" content="https://fabianocicala.com/assets/fabiano-camisa-azul-2026.webp">'
    '<meta name="twitter:card" content="summary_large_image">'
)
ensure_before("conteudos/index.html", '<link rel="icon"', contents_meta)

connections_meta = (
    '<link rel="canonical" href="https://fabianocicala.com/conexoes/">'
    '<meta name="robots" content="index,follow,max-image-preview:large">'
    '<meta property="og:type" content="website">'
    '<meta property="og:title" content="Conexões — Projetos e interesses | Fabiano Cicala">'
    '<meta property="og:description" content="Experiência prática, projetos e interesses de colaboração em novos negócios, tecnologia e mercados.">'
    '<meta property="og:url" content="https://fabianocicala.com/conexoes/">'
    '<meta property="og:image" content="https://fabianocicala.com/assets/fabiano-camisa-azul-2026.webp">'
    '<meta name="twitter:card" content="summary_large_image">'
)
ensure_before("conexoes/index.html", '<link rel="icon"', connections_meta)

books_meta = (
    '  <meta name="robots" content="index,follow,max-image-preview:large">\n'
    '  <meta property="og:url" content="https://fabianocicala.com/livros/">\n'
    '  <meta name="twitter:card" content="summary_large_image">\n'
)
ensure_before("livros/index.html", '  <link rel="icon"', books_meta)

life_schema = (
    '<meta name="robots" content="index,follow,max-image-preview:large">'
    '<script type="application/ld+json">'
    '{"@context":"https://schema.org","@type":"Book","name":"A Vida É para Ser Vivida",'
    '"author":{"@type":"Person","@id":"https://fabianocicala.com/#autor","name":"Fabiano Cicala"},'
    '"url":"https://fabianocicala.com/livros/a-vida-e-para-ser-vivida/",'
    '"image":"https://fabianocicala.com/img/optimized/capa-a-vida-e-para-ser-vivida.jpg",'
    '"description":"Memórias de perdas, trabalho, escolhas e recomeços.","inLanguage":"pt-BR"}'
    '</script>'
)
ensure_before("livros/a-vida-e-para-ser-vivida/index.html", '<link rel="stylesheet" href="/typography.css', life_schema)

night_meta = (
    '<link rel="canonical" href="https://fabianocicala.com/livros/quando-o-dia-termina/">'
    '<meta name="robots" content="index,follow,max-image-preview:large">'
    '<meta name="twitter:card" content="summary_large_image">'
    '<script type="application/ld+json">'
    '{"@context":"https://schema.org","@type":"Book","name":"Quando o dia termina",'
    '"author":{"@type":"Person","@id":"https://fabianocicala.com/#autor","name":"Fabiano Cicala"},'
    '"url":"https://fabianocicala.com/livros/quando-o-dia-termina/",'
    '"image":"https://fabianocicala.com/livros/quando-o-dia-termina/assets/capa.jpg",'
    '"description":"Práticas de relaxamento, fé e autoconhecimento.","inLanguage":"pt-BR"}'
    '</script>'
)
ensure_before("livros/quando-o-dia-termina/index.html", '<link rel="stylesheet" href="/typography.css', night_meta)
replace_once(
    "livros/quando-o-dia-termina/index.html",
    'content="https://fabianocicala.com/livros/quando-o-dia-termina">',
    'content="https://fabianocicala.com/livros/quando-o-dia-termina/">',
)

footer_scripts = (
    '<script src="/brand-footer.js?v=20261106seo1" defer></script>'
)
for page in (
    "conteudos/index.html",
    "conteudos/a-experiencia-vira-criterio/index.html",
    "conteudos/teste-antes-de-importar/index.html",
    "conteudos/ia-sem-abrir-mao-da-decisao/index.html",
):
    ensure_before(page, '</body>', footer_scripts)

print("SEO técnico aplicado às páginas pessoais autorizadas.")
