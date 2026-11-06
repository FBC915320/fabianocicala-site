#!/usr/bin/env python3
"""Validação local dos elementos técnicos essenciais de SEO."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional
from urllib.parse import urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"404.html", "form-sent.html", "obrigado.html"}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = 0
        self.description = 0
        self.h1 = 0
        self.canonical = []
        self.refresh = False
        self.viewport = 0
        self.links = []
        self.jsonld = []
        self._json = False
        self._buffer = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "title":
            self.title += 1
        elif tag == "meta":
            name = values.get("name", "").lower()
            if name == "description":
                self.description += 1
            elif name == "viewport":
                self.viewport += 1
            if values.get("http-equiv", "").lower() == "refresh":
                self.refresh = True
        elif tag == "h1":
            self.h1 += 1
        elif tag == "link" and "canonical" in values.get("rel", "").lower():
            self.canonical.append(values.get("href", ""))
        elif tag == "a" and values.get("href"):
            self.links.append(values["href"])
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._json = True
            self._buffer = []

    def handle_endtag(self, tag):
        if tag == "script" and self._json:
            self.jsonld.append("".join(self._buffer).strip())
            self._json = False
            self._buffer = []

    def handle_data(self, data):
        if self._json:
            self._buffer.append(data)


def local_target(source: Path, href: str) -> Optional[Path]:
    if href.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    parsed = urlsplit(href)
    if parsed.scheme or parsed.netloc:
        return None
    clean = parsed.path
    if not clean:
        return None
    target = ROOT / clean.lstrip("/") if clean.startswith("/") else source.parent / clean
    if clean.endswith("/"):
        target /= "index.html"
    elif not target.suffix:
        target /= "index.html"
    return target.resolve()


errors = []
html_files = sorted(p for p in ROOT.rglob("*.html") if "cikala-manuais" not in p.parts)
page_results = {}
for page in html_files:
    rel = page.relative_to(ROOT).as_posix()
    parser = PageParser()
    parser.feed(page.read_text(encoding="utf-8"))
    page_results[page.resolve()] = parser
    if parser.title != 1:
        errors.append(f"{rel}: quantidade de title = {parser.title}")
    if parser.description != 1 and rel not in EXCLUDED:
        errors.append(f"{rel}: quantidade de description = {parser.description}")
    if parser.h1 != 1 and rel not in EXCLUDED:
        errors.append(f"{rel}: quantidade de h1 = {parser.h1}")
    if parser.viewport != 1:
        errors.append(f"{rel}: quantidade de meta viewport = {parser.viewport}")
    for block in parser.jsonld:
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            errors.append(f"{rel}: JSON-LD inválido: {exc}")
    for href in parser.links:
        target = local_target(page, href)
        if target and not target.exists():
            errors.append(f"{rel}: link interno sem destino: {href}")

sitemap = ROOT / "sitemap.xml"
try:
    tree = ElementTree.parse(sitemap)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text for node in tree.findall("s:url/s:loc", ns)]
    if len(urls) != len(set(urls)):
        errors.append("sitemap.xml: URLs duplicadas")
    if "https://fabianocicala.com/conteudos/" not in urls:
        errors.append("sitemap.xml: índice de conteúdos ausente")
    for url in urls:
        parsed = urlsplit(url)
        relative = parsed.path.lstrip("/")
        local = ROOT / relative
        if parsed.path.endswith("/"):
            local /= "index.html"
        if parsed.path == "/":
            local = ROOT / "index.html"
        local = local.resolve()
        if not local.exists():
            errors.append(f"sitemap.xml: URL sem arquivo local: {url}")
            continue
        parser = page_results.get(local)
        if parser and parser.canonical != [url]:
            errors.append(f"{local.relative_to(ROOT)}: canonical esperado {url}, encontrado {parser.canonical}")
        if parser and parser.refresh:
            errors.append(f"sitemap.xml: página de redirecionamento incluída: {url}")
except ElementTree.ParseError as exc:
    errors.append(f"sitemap.xml inválido: {exc}")

robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
if "Sitemap: https://fabianocicala.com/sitemap.xml" not in robots:
    errors.append("robots.txt: referência ao sitemap ausente")

if errors:
    print("FALHAS DE SEO:")
    for error in errors:
        print("-", error)
    sys.exit(1)

print(f"SEO validado: {len(html_files)} páginas pessoais, JSON-LD, links internos, sitemap e robots.txt.")
