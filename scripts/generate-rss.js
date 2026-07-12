#!/usr/bin/env node
/* =========================================================
   Privacy Log — RSS feed generator
   Reads blog/blog.json (the single source of truth that also
   drives blog.html) and writes blog/rss.xml — a valid RSS 2.0
   feed. Re-run this whenever posts change so the feed stays
   live/current:  node scripts/generate-rss.js
   No dependencies — Node standard library only.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'blog', 'blog.json');
const OUT = path.join(ROOT, 'blog', 'rss.xml');

function xml(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function cdata(s){
  // guard against a literal "]]>" inside the payload
  return '<![CDATA[' + String(s == null ? '' : s).replace(/]]>/g, ']]]]><![CDATA[>') + ']]>';
}
function rfc822(iso){
  const d = new Date((iso || '') + 'T00:00:00Z');
  return isNaN(d) ? '' : d.toUTCString();
}
function nowRfc822(){ return new Date().toUTCString(); }

// Absolute-ise a possibly-relative asset/page path against the site root.
function abs(site, p){
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return site.replace(/\/+$/, '') + '/' + String(p).replace(/^\/+/, '');
}

// Render a body block to feed-safe HTML (mirrors assets/blog.js renderer).
function blockHtml(site, b){
  switch (b.type){
    case 'kicker': return `<p><strong>${xml(b.text)}</strong></p>`;
    case 'h2':     return `<h2>${xml(b.text)}</h2>`;
    case 'quote':  return `<blockquote><p>${xml(b.text)}</p>${b.cite ? `<cite>&mdash; ${xml(b.cite)}</cite>` : ''}</blockquote>`;
    case 'list':   return `<ul>${(b.items || []).map(i => `<li>${xml(i)}</li>`).join('')}</ul>`;
    case 'image':  return `<figure><img src="${xml(abs(site, b.src))}" alt="${xml(b.alt || '')}" />${b.caption ? `<figcaption>${xml(b.caption)}</figcaption>` : ''}</figure>`;
    case 'p':
    default:       return `<p>${xml(b.text)}</p>`;
  }
}

function main(){
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const meta = data.meta || {};
  const site = (meta.site || 'https://privacypal.ai').replace(/\/+$/, '');
  const authors = {};
  (data.authors || []).forEach(a => { authors[a.id] = a; });

  const feedUrl = meta.rss || (site + '/blog/rss.xml');
  const pageUrl = meta.base || (site + '/blog.html');
  const email   = meta.email || 'hello@privacypal.ai';

  const articles = (data.articles || []).slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const latest = articles[0] ? rfc822(articles[0].date) : nowRfc822();

  const items = articles.map(a => {
    const au = authors[a.author] || { name: a.author || 'PrivacyPal Team' };
    const link = site + '/blog-article.html?id=' + encodeURIComponent(a.id);
    const cats = (a.tags || []).map(t => `      <category>${xml(t)}</category>`).join('\n');
    const heroImg = a.hero ? `<p><img src="${xml(abs(site, a.hero))}" alt="${xml(a.title)}" /></p>` : '';
    const bodyHtml = heroImg + (a.body || []).map(b => blockHtml(site, b)).join('\n');
    return `    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${rfc822(a.date)}</pubDate>
      <dc:creator>${xml(au.name)}</dc:creator>
      <author>${xml(email)} (${xml(au.name)})</author>
${cats ? cats + '\n' : ''}      <description>${cdata(a.excerpt || '')}</description>
      <content:encoded>${cdata(bodyHtml)}</content:encoded>
    </item>`;
  }).join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(meta.title || 'The Privacy Log')}</title>
    <link>${xml(pageUrl)}</link>
    <atom:link href="${xml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${xml(meta.tagline || "PrivacyPal's blog.")}</description>
    <language>${xml(meta.language || 'en-us')}</language>
    <copyright>${xml(meta.copyright || '© PrivacyPal')}</copyright>
    <managingEditor>${xml(email)} (PrivacyPal)</managingEditor>
    <webMaster>${xml(email)} (PrivacyPal)</webMaster>
    <generator>PrivacyPal Privacy Log RSS generator</generator>
    <lastBuildDate>${nowRfc822()}</lastBuildDate>
    <pubDate>${latest}</pubDate>
    <ttl>60</ttl>
    <image>
      <url>${xml(abs(site, 'assets/logo-color.png'))}</url>
      <title>${xml(meta.title || 'The Privacy Log')}</title>
      <link>${xml(pageUrl)}</link>
    </image>
${items}
  </channel>
</rss>
`;

  fs.writeFileSync(OUT, feed, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, OUT)} — ${articles.length} item(s), built ${nowRfc822()}`);
}

main();
