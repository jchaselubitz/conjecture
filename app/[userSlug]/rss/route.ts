import { NextResponse } from 'next/server';

import { getStatementsCached } from '@/lib/actions/statementActions';
import { getStatementDetailsCached } from '@/lib/actions/statementActions';
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

const buildContent = (content?: string | null) => {
  if (content && content.trim().length > 0) {
    // Clean up the content and ensure proper encoding
    return content
      .trim()
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
      .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, ' '); // Replace various Unicode spaces
  }
  return '';
};

const buildImageEnclosure = (imageUrl?: string | null) => {
  if (!imageUrl) return '';

  // For RSS, we need to provide file size and MIME type
  // Since we don't have this info readily available, we'll use reasonable defaults
  return `    <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />`;
};

const buildMediaContent = (imageUrl?: string | null) => {
  if (!imageUrl) return '';

  return `    <media:content url="${escapeXml(imageUrl)}" type="image/jpeg" medium="image" />`;
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

  const items = await Promise.all(
    statements
      .filter(statement => statement.draft?.publishedAt)
      .map(async statement => {
        const publishedAt = statement.draft?.publishedAt
          ? new Date(statement.draft.publishedAt)
          : null;
        const description = buildDescription(statement.subtitle);
        const content = buildContent(statement.draft?.content ?? null);
        const link = `${SITE_URL}/${userSlug}/${statement.slug}`;
        const authorNames = statement.authors?.map(author => author?.name).filter(Boolean) ?? [];

        // Get statement images for featured image
        let featuredImage = statement.headerImg;
        if (!featuredImage && statement.draft?.id) {
          try {
            const statementDetails = await getStatementDetailsCached({
              statementId: statement.statementId,
              draftId: statement.draft.id,
              version: statement.draft.versionNumber
            });
            // Use the first image as featured image if no header image
            featuredImage = statementDetails.images?.[0]?.src;
          } catch (error) {
            console.error('Error fetching statement images:', error);
          }
        }

        const imageEnclosure = buildImageEnclosure(featuredImage);
        const mediaContent = buildMediaContent(featuredImage);

        return `      <item>
        <title>${escapeXml(statement.title ?? 'Untitled')}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="false">${escapeXml(
          `${statement.statementId}:${statement.draft?.versionNumber ?? ''}`
        )}</guid>
        ${publishedAt ? `<pubDate>${publishedAt.toUTCString()}</pubDate>` : ''}
        <description>${escapeXml(description)}</description>
        ${content ? `<content:encoded><![CDATA[${content}]]></content:encoded>` : ''}
        ${imageEnclosure}
        ${mediaContent}
        ${
          authorNames.length
            ? authorNames
                .map(author => `<author>${escapeXml(author ?? '')}</author>`)
                .join('\n        ')
            : ''
        }
      </item>`;
      })
  );

  const itemsString = items.join('\n');

  const channelLastBuild =
    statements[0]?.draft?.publishedAt ?? statements[0]?.createdAt ?? new Date();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(profile.name ?? profile.username ?? 'Conject Writer')}</title>
    <link>${escapeXml(`${SITE_URL}/${userSlug}`)}</link>
    <description>${escapeXml(
      `${profile.followerCount ?? 0} follower${profile.followerCount === 1 ? '' : 's'} on Conject`
    )}</description>
    <language>en</language>
    <lastBuildDate>${new Date(channelLastBuild).toUTCString()}</lastBuildDate>
    ${profile.imageUrl ? `<image><url>${escapeXml(profile.imageUrl)}</url></image>` : ''}
${itemsString}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
    }
  });
}
