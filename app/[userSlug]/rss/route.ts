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

const proseStyles = `
.newsletter-email p.is-editor-empty:first-child::before {
color: var(--tw-prose-captions);
opacity: 0.5;
content: attr(data-placeholder);
float: left;
height: 0;
pointer-events: none;
}

.newsletter-email:focus p.is-editor-empty:first-child::before {
display: none;
}

    .newsletter-email .header-image {
        width: 100%;
        height: 432px;
        object-fit: cover;
        display: block;
      }

.newsletter-email h1 {
font-size: 3em;
font-weight: 800;
line-height: 1;

margin-bottom: 0.4em;
}

.newsletter-email h2 {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.3;
        margin: 0 0 24px 0;
        color: #6b7280;
}

.newsletter-email h3 {
font-size: 1.25em;
font-weight: 600;
line-height: 1.3;
margin-top: 1.6em;
margin-bottom: 0.6em;
}

.newsletter-email h4 {
font-size: 1.2em;
font-weight: 500;
line-height: 1.3;
margin-top: 1em;
margin-bottom: 0.6em;
}

.newsletter-email p {
font-size: 1.3em;
line-height: 1.6;
margin-bottom: 1.2em;
}

.newsletter-email p .citation-reference {
display: inline-block;
vertical-align: top;
}

.newsletter-email p .citation-number {
vertical-align: top;
}

/* List styles */
.newsletter-email ul,
.newsletter-email ol {
padding-left: 1.5em;
margin-bottom: 1.2em;
}

.newsletter-email ul {
list-style-type: disc;
}

.newsletter-email ul ul {
list-style-type: circle;
}

.newsletter-email ul ul ul {
list-style-type: square;
}

.newsletter-email ol {
list-style-type: decimal;
}

.newsletter-email ol ol {
list-style-type: lower-alpha;
}

.newsletter-email ol ol ol {
list-style-type: lower-roman;
}

.newsletter-email li {
margin-bottom: 0.5em;
line-height: 1.6;
}

.newsletter-email li p {
margin: 0;
}

.newsletter-email hr {
  border: 1px solid #e2e8f0;
  margin: 1.6em 0;
}

.newsletter-email .citation-reference {
text-decoration: none;
cursor: pointer;
}
.newsletter-email .citation-number {
display: inline-flex;
align-items: center;
justify-content: center;
background-color: #e2e8f0;
color: #475569;
border-radius: 50%;
width: 20px;
height: 20px;
font-size: 12px;
transition: all 0.2s ease;
cursor: pointer;
font-style:normal !important;
margin-left: 0.25rem;
}

.newsletter-email .citation-number:hover {
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
background-color: #f1f5f9;
}
.newsletter-email .citation-number:focus {
border: 1px solid #1454a8;
}

.newsletter-email img[data-type="block-image"] {
display: block;
max-width: 100%;
height: auto;
margin-top: 2rem;
cursor: pointer;
border-radius: 4px;
transition: all 0.2s ease;
}

.newsletter-email img[data-type="block-image"] .caption {
font-size: 0.75rem;
color: hsl(var(--muted-foreground));
margin-bottom: 3rem;
text-align: center;
}

.newsletter-email img[data-type="block-image"]:hover {
box-shadow: 0 0 0 3px hsl(var(--muted), 0.3);
}

/* Annotation marker styles */
.newsletter-email .annotation-marker {
display: none !important;
user-select: none !important;
pointer-events: none !important;
width: 0 !important;
height: 0 !important;
margin: 0 !important;
padding: 0 !important;
}

/* Base annotation styles - no highlight by default */
.newsletter-email mark.annotation {
cursor: default;
border-radius: 0.125rem;
transition: all 0.2s ease;
border-bottom: none;
background-color: transparent;
text-decoration: none;
pointer-events: none;
}

/* Show author comments when enabled */
.show-author-comments .newsletter-email mark.annotation[data-is-author="true"] {
cursor: pointer;
background-color: var(--bg-color);
pointer-events: auto;
}

/* Show reader comments when enabled */
.show-reader-comments .newsletter-email mark.annotation[data-is-author="false"] {
cursor: pointer;
background-color: var(--bg-color);
pointer-events: auto;
}

/* Annotation hover and selection styles - without !important */
.newsletter-email mark.annotation:hover:not([data-type="latex"]):not([data-type="latex-block"]):not(.latex-block):not(.inline-latex) {
background-color: var(--hover-bg-color);
}

.newsletter-email mark.annotation.selected:not([data-type="latex"]):not([data-type="latex-block"]):not(.latex-block):not(.inline-latex) {
background-color: var(--hover-bg-color);
border-bottom: 2px solid var(--border-color);
}

/* LaTeX compatibility with annotations - with higher specificity */
.newsletter-email mark.annotation[data-type="latex"],
.newsletter-email mark.annotation[data-type="latex-block"],
.newsletter-email mark.annotation .latex-block,
.newsletter-email mark.annotation .inline-latex {
background-color: inherit;
border-color: inherit;
}

/* Preserve LaTeX styling within annotations */
.newsletter-email mark.annotation[data-type="latex-block"],
.newsletter-email mark.annotation .latex-block {
display: block;
text-align: center;
margin: 1rem 0;
padding: 0.75rem;
font-size: 1.2em;
background: #f4e7d661;
}

/* Ensure inline LaTeX maintains its styling when annotated */
.newsletter-email mark.annotation[data-type="latex"],
.newsletter-email mark.annotation .inline-latex {
display: inline-block;
padding: 0 2px;
line-height: inherit;
font-size: inherit;
background-color: rgba(0, 102, 204, 0.05);
}

/* Preserve hover effects for LaTeX elements within annotations */
.newsletter-email mark.annotation[data-type="latex"]:hover,
.newsletter-email mark.annotation .inline-latex:hover,
.newsletter-email mark.annotation[data-type="latex-block"]:hover,
.newsletter-email mark.annotation .latex-block:hover {
background-color: hsl(var(--muted) / 0.5);
}

/* Ensure KaTeX rendering is preserved within annotations */
.newsletter-email mark.annotation .katex {
font-size: 1.1em;
line-height: 1.2;
}

/* Style for the container when used as an annotator */
.newsletter-email.annotator-container {
position: relative;
caret-color: transparent;
}

/* Add a subtle indicator when the text is annotatable */
.newsletter-email.annotator-container::after {
content: "";
position: absolute;
top: 0.5rem;
right: 0.5rem;
width: 0.75rem;
height: 0.75rem;
background-color: #e2e8f0;
border-radius: 50%;
opacity: 0.5;
}

/* Add LaTeX-specific styles for annotator */
.annotator-container .latex-block,
.annotator-container .inline-latex {
pointer-events: none;
}

/* Allow pointer events on LaTeX elements in editable mode */
.editable-container .latex-block,
.editable-container .inline-latex {
pointer-events: auto;
}

.annotator-container .latex-block {
margin: 1rem 0;
padding: 0.5rem;
}

/* Ensure LaTeX renders at the correct size in the annotator */
.annotator-container .katex {
font-size: 1.1em;
}

/* Remove outlines */
.newsletter-email:focus, 
.newsletter-email *:focus {
outline: none !important;
}

.newsletter-email .quoted-text {
animation: highlight-fade 7s ease-out;
border-radius: 10px;
padding: 2px 5px;
}

@keyframes highlight-fade {
0% {
  background-color: rgba(255, 221, 0, 0.3);
  transform: scale(1);
}
15% {
  background-color: rgba(255, 221, 0, 0.9);
  transform: scale(1.01);
}
30% {
  background-color: rgba(255, 221, 0, 0.6);
  transform: scale(1);
}
66% {
  background-color: rgba(255, 221, 0, 0.2);
  transform: scale(1);
}
100% {
  background-color: transparent;
  box-shadow: none;
  transform: scale(1);

}
}

/* Link styles */
.newsletter-email .prose-link {
color: var(--muted-foreground);
text-decoration: underline;
cursor: pointer;
transition: all 0.2s ease;
}

.newsletter-email .prose-link:hover {
text-decoration: underline;
text-decoration-color: var(--muted-foreground);
color: black
}

/* Blockquote styles */
.newsletter-email blockquote {
border-left: 3px solid #e2e8f0;
padding-left: 1.5em;
margin-left: 0;
margin-right: 0;
margin-top: 1.6em;
margin-bottom: 1.6em;
font-style: italic;
color: #4a5568;
background-color: #f8fafc;
padding: 1em 1.5em;
border-radius: 0.25rem;
}

.newsletter-email blockquote p {
margin-bottom: 0.5em;
}

.newsletter-email blockquote p:last-child {
margin-bottom: 0;
}

.newsletter-email blockquote .citation-reference {
display: inline-block;
vertical-align: top;
}

.newsletter-email blockquote .citation-number {
vertical-align:middle;
margin-left: 0.25rem;
line-height: 0;
}

/* Table styles for email compatibility */
.newsletter-email table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
}
.newsletter-email th, .newsletter-email td {
  border: 1px solid #e2e8f0;
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
}
.newsletter-email th {
  background: #f1f5f9;
  font-weight: bold;
}
`;

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
        const link = `${SITE_URL}/${userSlug}/${statement.slug}?utm_source=rssfeed`;
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

        // Add a call-to-action link at the top of the content with styling
        const contentWithLink = content
          ? `<style>${proseStyles}</style>
            <div class="newsletter-email">
              <p><a href="${escapeXml(link)}" class="prose-link">Read on Conject to respond</a></p>
              ${content}
            </div>`
          : `<style>${proseStyles}</style>
            <div class="newsletter-email">
              <p><a href="${escapeXml(link)}" class="prose-link">Read on Conject to respond</a></p>
            </div>`;

        return `      <item>
        <title>${escapeXml(statement.title ?? 'Untitled')}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="false">${escapeXml(
          `${statement.statementId}:${statement.draft?.versionNumber ?? ''}`
        )}</guid>
        ${publishedAt ? `<pubDate>${publishedAt.toUTCString()}</pubDate>` : ''}
        <description>${escapeXml(description)}</description>
        ${contentWithLink ? `<content:encoded><![CDATA[${contentWithLink}]]></content:encoded>` : ''}
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
      `Opinions from ${profile.name ?? profile.username} on Conject`
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
