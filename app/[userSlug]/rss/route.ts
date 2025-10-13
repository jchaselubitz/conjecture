import { NextResponse } from 'next/server';

import { getStatementsCached } from '@/lib/actions/statementActions';
import { userProfileCache } from '@/lib/actions/userActions';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildDescription = (subtitle?: string | null) => {
  if (subtitle && subtitle.trim().length > 0) {
    const text = subtitle.trim();
    return text.length > 280 ? `${text.slice(0, 277)}...` : text;
  }
  return '';
};

const buildContent = (contentPlainText?: string | null) => {
  if (contentPlainText && contentPlainText.trim().length > 0) {
    return contentPlainText.trim();
  }
  return '';
};

export async function GET(_request: Request, context: { params: Promise<{ userSlug: string }> }) {
  const { userSlug } = await context.params;
  const profile = await userProfileCache(userSlug);

  if (!profile) {
    return NextResponse.json({ message: 'Writer not found' }, { status: 404 });
  }

  const statements = await getStatementsCached({
    creatorId: profile.id,
    publishedOnly: true
  });

  const items = statements
    .filter(statement => statement.draft?.publishedAt)
    .map(statement => {
      const publishedAt = statement.draft?.publishedAt
        ? new Date(statement.draft.publishedAt)
        : null;
      const description = buildDescription(statement.subtitle);
      const content = buildContent(statement.draft?.contentPlainText ?? null);
      const link = `${SITE_URL}/${userSlug}/${statement.slug}`;
      const authorNames = statement.authors?.map(author => author?.name).filter(Boolean) ?? [];

      return `      <item>
        <title>${escapeXml(statement.title ?? 'Untitled')}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="false">${escapeXml(
          `${statement.statementId}:${statement.draft?.versionNumber ?? ''}`
        )}</guid>
        ${publishedAt ? `<pubDate>${publishedAt.toUTCString()}</pubDate>` : ''}
        <description>${escapeXml(description)}</description>
        ${content ? `<content:encoded><![CDATA[${content}]]></content:encoded>` : ''}
        ${
          authorNames.length
            ? authorNames
                .map(author => `<author>${escapeXml(author ?? '')}</author>`)
                .join('\n        ')
            : ''
        }
      </item>`;
    })
    .join('\n');

  const channelLastBuild =
    statements[0]?.draft?.publishedAt ?? statements[0]?.createdAt ?? new Date();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(profile.name ?? profile.username ?? 'Conject Writer')}</title>
    <link>${escapeXml(`${SITE_URL}/${userSlug}`)}</link>
    <description>${escapeXml(
      `${profile.followerCount ?? 0} follower${profile.followerCount === 1 ? '' : 's'} on Conject`
    )}</description>
    <language>en</language>
    <lastBuildDate>${new Date(channelLastBuild).toUTCString()}</lastBuildDate>
    ${profile.imageUrl ? `<image><url>${escapeXml(profile.imageUrl)}</url></image>` : ''}
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
    }
  });
}
