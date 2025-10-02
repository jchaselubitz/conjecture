import { NextRequest, NextResponse } from 'next/server';

import db from '../../lib/database';

// Handle both www and non-www domains based on request

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const xmlUrls = urls
    .map(url => {
      const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : '';
      const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
      const priority = url.priority ? `\n    <priority>${url.priority}</priority>` : '';

      return `  <url>
    <loc>${url.loc}</loc>${lastmod}${changefreq}${priority}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

export async function GET(request: NextRequest) {
  // Handle both www and non-www domains for Google Search Console compatibility
  const host = request.headers.get('host') || '';
  const BASE_URL_WWW = 'https://www.conject.io';
  const BASE_URL_NON_WWW = 'https://conject.io';

  // Use www as canonical, but serve content for both domains
  // Handle development environment
  let baseUrl: string;
  if (process.env.NEXT_PUBLIC_CONTEXT === 'development') {
    baseUrl = 'http://localhost:3000';
  } else {
    baseUrl = host.includes('www.') ? BASE_URL_WWW : BASE_URL_NON_WWW;
  }

  try {
    const urls: SitemapUrl[] = [
      // Static pages
      {
        loc: `${baseUrl}/`,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/feed`,
        changefreq: 'hourly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/login`,
        changefreq: 'monthly',
        priority: 0.3
      },
      {
        loc: `${baseUrl}/sign-up`,
        changefreq: 'monthly',
        priority: 0.3
      }
    ];
    // Get all published statements
    const publishedStatements = await db
      .selectFrom('statement')
      .innerJoin('draft', 'statement.statementId', 'draft.statementId')
      .innerJoin('profile', 'statement.creatorId', 'profile.id')
      .select([
        'statement.slug',
        'statement.statementId',
        'profile.username as creatorSlug',
        'draft.publishedAt',
        'draft.updatedAt'
      ])
      .where('draft.publishedAt', 'is not', null)
      .execute();
    // Add statement URLs
    for (const statement of publishedStatements) {
      if (statement.creatorSlug && statement.slug) {
        urls.push({
          loc: `${baseUrl}/${statement.creatorSlug}/${statement.slug}`,
          lastmod: statement.updatedAt?.toISOString() || statement.publishedAt?.toISOString(),
          changefreq: 'weekly',
          priority: 0.8
        });
      }
    }
    // Get all user profiles (for user pages)
    const userProfiles = await db
      .selectFrom('profile')
      .select(['username', 'updatedAt'])
      .where('username', 'is not', null)
      .execute();
    // Add user profile URLs
    for (const profile of userProfiles) {
      if (profile.username) {
        urls.push({
          loc: `${baseUrl}/${profile.username}`,
          lastmod: profile.updatedAt?.toISOString(),
          changefreq: 'weekly',
          priority: 0.6
        });
      }
    }
    // Generate XML sitemap
    const sitemapXml = generateSitemapXml(urls);
    return new NextResponse(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
