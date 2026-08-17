/**
 * Writes a static sitemap.xml for GitHub Pages.
 * Run from `npm run build` so lastmod stays current.
 */
import { writeFileSync } from 'node:fs';

const origin = 'https://www.openexpense.org';
const lastmod = new Date().toISOString().slice(0, 10);

const urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' }
];

const body = urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`);

console.log(`sitemap.xml written (${lastmod})`);
