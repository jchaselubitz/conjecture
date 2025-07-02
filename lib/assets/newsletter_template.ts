import { StatementWithUser } from 'kysely-codegen';

const mainStyles = ` * {
        .newsletter-email box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #222;
}
      
      /* Image styles */
      .newsletter-email img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1rem 0;
        border-radius: 6px;
      }
      
      
      /* Container styles matching statement layout */
     .newsletter-email .main-container {
        max-width: 768px;
        margin: 0 auto;
        background: #fff;
        overflow: hidden;
   
      }
      

      .newsletter-email .header-link {
        text-decoration: none;
        display: block;
      }
      
      .newsletter-email .header-link:hover {
        opacity: 0.95;
      }
      
      .newsletter-email .content-wrapper {
        padding: 24px 0; 
      }
      
      .newsletter-email .title-section {
        margin-bottom: 24px;
        text-align: left;
      }
      
      .newsletter-email .title-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      
      .newsletter-email .title-link:hover {
        opacity: 0.9;
      }
      
      .newsletter-email .content-area {
        font-size: 1rem;
        line-height: 1.6;
        color: #222;
        text-align: left;
      }
      
      .newsletter-email .content-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      
      .newsletter-email .content-link:hover {
        opacity: 0.95;
      }
      
      /* Annotation link styles */
      .newsletter-email .annotation-link {
        background-color: #dde4ed;
        color: #4b5563;
        padding: 2px 4px;
        border-radius: 3px;
        text-decoration: none;
        border-bottom: 1px solid #a5b4c7;
        transition: all 0.2s ease;
      }
      
      .newsletter-email .annotation-link:hover {
        background-color: #c9d6e3;
        color: #374151;
      }

      
      .newsletter-email .byline {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #dde4ed;
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.2s ease;
      }
      
      .newsletter-email .byline:hover {
        opacity: 0.8;
      }
      
      .newsletter-email .avatar-group {
        display: flex;
        align-items: center;
      }
      
      .newsletter-email .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #fff;
        object-fit: cover;
        background-color: #dde4ed;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: #4b5563;
      }
      
      .newsletter-email .avatar:not(:first-child) {
        margin-left: -16px;
      }
      
      .newsletter-email .authors {
        font-weight: 600;
        color: #222;
        font-size: 1rem;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .newsletter-email h1 {
          font-size: 2rem;
        }
        
        .newsletter-email h2 {
          font-size: 1.125rem;
        }
        
        .newsletter-email .content-wrapper {
          padding: 24px 16px;
        }
        
        .newsletter-email .header-image {
          height: 240px;
        }
      }`;

const latexStyles = `.newsletter-email latex-error {
color: red;
font-style: italic;
background-color: #ffeeee;
padding: 0.25rem 0.5rem;
border-radius: 2px;
}

/* Base styles for all LaTeX elements */
.newsletter-email [data-type="latex-block"],
.newsletter-email .latex-block,
.newsletter-email [data-type="latex"],
.newsletter-email .inline-latex {
cursor: pointer;
border-radius: 4px;
transition: background-color 0.2s ease;
}

/* Block LaTeX styles */
[data-type="latex-block"],
.latex-block {
display: block;
text-align: center;
margin-top: 1.6em;
padding: 0.75rem;
margin: 1rem 0;
font-size: 1.2em;
 background: #f4e7d661;

}

/* Inline LaTeX styles */
[data-type="latex"],
.inline-latex {
display: inline-block;
padding: 0 2px;
margin: 0;
line-height: inherit;
font-size: inherit;
background-color: rgba(0, 102, 204, 0.05);
}

/* Edit indicator for block LaTeX */
[data-type="latex-block"]:hover::after {
content: "Edit";
position: absolute;
top: 5px;
right: 10px;
background-color: hsl(var(--muted));
color: hsl(var(--muted-foreground));
/* padding: 0.125rem 0.25rem; */
font-size: 0.75rem;
border-bottom-left-radius: 4px;
}

/* KaTeX rendering styles */
.ProseMirror .katex {
font-size: 1.1em;
line-height: 1.2;
}

.katex-rendered {
overflow-x: auto;
max-width: 100%;
font-size: 1.1em;
line-height: 1.5;
}

.latex-rendered {
overflow-x: auto;
max-width: 100%;
font-size: 1.1em;
line-height: 1.5;
display: block;
text-align: center;
padding: 0.75rem 0;
margin: 1rem 0;
background-color: hsl(var(--muted), 0.3);
border-radius: 0.25rem;
}

.katex-rendered.block-display {
display: block;
text-align: center;
padding: 0.75rem 0;
margin: 1rem 0;
background-color: rgba(0, 102, 204, 0.05);
border-radius: 0.25rem;
}

.katex-rendered.inline-display {
display: inline-block;
padding: 0 2px;
}`;

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

/* .newsletter-email {
outline: none !important;
} */

/* Basic editor styles */
/* .newsletter-email {
outline: none !important;
box-shadow: none !important;
} */

/* Remove outlines on all nodes */
/* .newsletter-email *:focus,
.newsletter-email *:hover,
.newsletter-email *:active {
outline: none !important;
box-shadow: none !important;
} */

/* Remove node selection indicators */
/* .newsletter-email .newsletter-email-selectednode {
outline: none !important;
border: none !important;
} */

/* Remove cursor outline when editor is focused */
/* .newsletter-email.newsletter-email-focused {
outline: none !important;
box-shadow: none !important;
} */

/* Customize text selection appearance */
/* .newsletter-email ::selection {
background-color: rgba(66, 153, 225, 0.3); 
color: inherit;
} */

/* Style for the selection when selecting across nodes */
/* .newsletter-email-selectednode {
background-color: rgba(66, 153, 225, 0.1) !important;
} */

/* Style for node selections and drag handles */
/* .newsletter-email-gapcursor:after {
border-top: 1px solid rgba(66, 153, 225, 0.5) !important;
} */


/* .auto-resize-input {
resize: none;
overflow: hidden;
white-space: nowrap;
} */

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

export function getNewsletterHtml({
  statement,
  subscriberEmail,
  previewMode = false
}: {
  statement: StatementWithUser;
  subscriberEmail?: string;
  previewMode?: boolean;
}): string {
  const title = statement.title || '';
  const subtitle = statement.subtitle || '';
  const headerImg = statement.headerImg || '';
  const htmlContent = statement.draft.content || '';
  const authors = statement.authors || [];
  const creatorSlug = statement.creatorSlug || '';
  const postUrl = `/${statement.creatorSlug}/${statement.slug}`;

  // Create the full URL with UTM parameters
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://conject.io';
  const fullPostUrl = `${baseUrl}${postUrl}?utm_source=newsletter&utm_medium=email&utm_campaign=statement_share`;

  const manageSubscriptionUrl = subscriberEmail
    ? `${baseUrl}/${creatorSlug}/manage-subscription?email=${subscriberEmail}`
    : `${baseUrl}/${creatorSlug}/manage-subscription`;

  // Update the htmlContent to replace annotation marks with clickable links
  const htmlContentWithLinks = htmlContent.replace(
    /<mark class="annotation"[^>]*data-annotation-id="([^"]*)"[^>]*>(.*?)<\/mark>/g,
    (match, annotationId, content) => {
      return `<a href="${fullPostUrl}&annotation-id=${annotationId}" target="_blank" class="annotation-link">${content}</a>`;
    }
  );

  // Assign sequential numbers to citation references in order of appearance and link each to fullPostUrl
  let citationCounter = 1;
  const numberedHtmlContent = htmlContentWithLinks.replace(
    /(<sup[^>]*class="citation-reference"[^>]*>\s*<span class="citation-number">)(.*?)(<\/span>\s*<\/sup>)/g,
    (match, prefix, oldNumber, suffix) => {
      return `${prefix}<a href="${fullPostUrl}" class="citation-number-link" target="_blank" rel="noopener noreferrer">${citationCounter++}</a>${suffix}`;
    }
  );

  const styles = `${proseStyles} ${mainStyles} ${latexStyles}`;

  let htmlContentToRender = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${styles}</style>
  </head>
  <body>
    <div class="newsletter-email">
      <!-- Browser view invitation -->
      <div style="text-align: center; padding: 12px; font-size: 11px; color: #9ca3af; background: #f9fafb;">
        Having trouble viewing this email? 
        <a href="${fullPostUrl}" style="color: #6b7280; text-decoration: underline;">
          View in browser
        </a>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;padding:24px 0;">
        <tr>
          <td align="center">
            <div class="main-container">
              ${
                headerImg
                  ? `
                <a href="${fullPostUrl}" class="header-link">
                  <img src="${headerImg}" alt="Header Image" class="header-image">
                </a>
              `
                  : ''
              }
              <div class="content-wrapper">
                <a href="${fullPostUrl}" class="title-link">
                  <div class="title-section">
                    <h1>${title}</h1>
                    ${subtitle ? `<h2>${subtitle}</h2>` : ''}
                  </div>
                </a>
                ${
                  authors.length > 0
                    ? `
                  <a href="${fullPostUrl}" class="byline">
                    <div class="avatar-group">
                      ${authors
                        .map(author =>
                          author.imageUrl
                            ? `<img src="${author.imageUrl}" alt="${
                                author.name || author.username || ''
                              }" class="avatar">`
                            : `<div class="avatar">${(author.name || author.username || '')
                                .slice(0, 2)
                                .toUpperCase()}</div>`
                        )
                        .join('')}
                    </div>
                    <div class="authors">
                      ${authors.map(author => author.name || author.username).join(', ')}
                    </div>
                  </a>
                `
                    : ''
                }
                <div class="content-area">
                  ${numberedHtmlContent}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #dde4ed; font-size: 12px; color: #6b7280; text-align: center;">
        <p style="margin-bottom: 0;">
          ${authors
            .map(author => author.name || author.username)
            .join(', ')} © ${new Date().getFullYear()} |
          <a href="${manageSubscriptionUrl}" style="color: #6b7280; text-decoration: underline;">
            Manage subscription
          </a>
        </p>
        <div class="footer">
          <p>
            Published with
            <a href="https://conject.io" class="footer-link">
              Conject
            </a>
          </p>
        </div>
      </div>
    </div>
  </body>`;

  if (previewMode) {
    return htmlContentToRender;
  }

  return `
  <!DOCTYPE html>
  <html lang="en">
  
  ${htmlContentToRender}
  </html>
  `;
}
