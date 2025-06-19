export function getNewsletterHtml({
  headerImg,
  title,
  subtitle,
  htmlContent,
  authors,
  postUrl
}: {
  headerImg: string;
  title: string;
  subtitle: string;
  htmlContent: string;
  authors: Array<{
    id: string;
    name: string | null | undefined;
    username: string | null | undefined;
    imageUrl: string | null | undefined;
  }>;
  postUrl: string;
}): string {
  // Create the full URL with UTM parameters
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://conject.io';
  const fullPostUrl = `${baseUrl}${postUrl}?utm_source=newsletter&utm_medium=email&utm_campaign=statement_share`;

  // Update the htmlContent to replace annotation marks with clickable links
  const updatedHtmlContent = htmlContent.replace(
    /<mark class="annotation"[^>]*data-annotation-id="([^"]*)"[^>]*>(.*?)<\/mark>/g,
    (match, annotationId, content) => {
      return `<a href="${fullPostUrl}&annotation-id=${annotationId}" target="_blank" class="annotation-link">${content}</a>`;
    }
  );

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        background: #f7f7f7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #222;
      }
      
      /* Typography matching statement_details.tsx */
      h1 {
        font-size: 3rem;
        font-weight: 700;
        line-height: 1.1;
        margin: 0 0 8px 0;
        color: #222;
      }
      
      h2 {
        font-size: 1.25rem;
        font-weight: 500;
        line-height: 1.3;
        margin: 0 0 24px 0;
        color: #6b7280;
      }
      
      h3 {
        font-size: 1.5em;
        font-weight: 600;
        line-height: 1.3;
        margin-top: 1.6em;
        margin-bottom: 0.6em;
        color: #222;
      }
      
      h4 {
        font-size: 1.2em;
        font-weight: 500;
        line-height: 1.3;
        margin-top: 1em;
        margin-bottom: 0.6em;
        color: #222;
      }
      
      p {
        font-size: 1.1em;
        line-height: 1.6;
        margin-bottom: 1.2em;
        color: #222;
      }
      
      /* List styles */
      ul, ol {
        padding-left: 1.5em;
        margin-bottom: 1.2em;
      }
      
      ul {
        list-style-type: disc;
      }
      
      ul ul {
        list-style-type: circle;
      }
      
      ul ul ul {
        list-style-type: square;
      }
      
      ol {
        list-style-type: decimal;
      }
      
      ol ol {
        list-style-type: lower-alpha;
      }
      
      ol ol ol {
        list-style-type: lower-roman;
      }
      
      li {
        margin-bottom: 0.5em;
        line-height: 1.6;
      }
      
      li p {
        margin: 0;
      }
      
      /* Link styles */
      a {
        color: #6b7280;
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      
      a:hover {
        color: #000;
        text-decoration: underline;
      }
      
      /* Blockquote styles */
      blockquote {
        border-left: 3px solid #dde4ed;
        padding-left: 1.5em;
        margin-left: 0;
        margin-right: 0;
        margin-top: 1.6em;
        margin-bottom: 1.6em;
        font-style: italic;
        color: #4a5568;
        background-color: #f1f4f8;
        padding: 1em 1.5em;
        border-radius: 0.25rem;
      }
      
      blockquote p {
        margin-bottom: 0.5em;
      }
      
      blockquote p:last-child {
        margin-bottom: 0;
      }
      
      /* Image styles */
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1rem 0;
        border-radius: 4px;
      }
      
      /* Citation styles */
      .citation-reference {
        text-decoration: none;
      }
      
      .citation-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #dde4ed;
        color: #4b5563;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        font-style: normal;
        margin-left: 0.25rem;
        vertical-align: middle;
      }
      
      /* Container styles matching statement layout */
      .main-container {
        max-width: 768px;
        margin: 0 auto;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      
      .header-image {
        width: 100%;
        height: 432px;
        object-fit: cover;
        display: block;
      }
      
      .header-link {
        text-decoration: none;
        display: block;
      }
      
      .header-link:hover {
        opacity: 0.95;
      }
      
      .content-wrapper {
        padding: 32px 24px;
      }
      
      .title-section {
        margin-bottom: 24px;
        text-align: left;
      }
      
      .title-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      
      .title-link:hover {
        opacity: 0.9;
      }
      
      .content-area {
        font-size: 1rem;
        line-height: 1.6;
        color: #222;
        text-align: left;
      }
      
      .content-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      
      .content-link:hover {
        opacity: 0.95;
      }
      
      /* Annotation link styles */
      .annotation-link {
        background-color: #dde4ed;
        color: #4b5563;
        padding: 2px 4px;
        border-radius: 3px;
        text-decoration: none;
        border-bottom: 1px solid #a5b4c7;
        transition: all 0.2s ease;
      }
      
      .annotation-link:hover {
        background-color: #c9d6e3;
        color: #374151;
      }
      
      .byline {
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
      
      .byline:hover {
        opacity: 0.8;
      }
      
      .avatar-group {
        display: flex;
        align-items: center;
      }
      
      .avatar {
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
      
      .avatar:not(:first-child) {
        margin-left: -16px;
      }
      
      .authors {
        font-weight: 600;
        color: #222;
        font-size: 1rem;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        h1 {
          font-size: 2rem;
        }
        
        h2 {
          font-size: 1.125rem;
        }
        
        .content-wrapper {
          padding: 24px 16px;
        }
        
        .header-image {
          height: 240px;
        }
      }
    </style>
  </head>
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f7f7;padding:24px 0;">
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
                ${updatedHtmlContent}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
