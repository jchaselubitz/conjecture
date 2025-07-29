# Automatic Sitemap Generation

This project includes an automatic sitemap generation system that creates and updates your sitemap.xml file on every commit.

## How It Works

### 1. Pre-commit Hook
A Git pre-commit hook automatically runs the sitemap generation script before each commit. This ensures your sitemap is always up-to-date with the latest content.

### 2. Static Generation Script
The `scripts/generate-sitemap.ts` script:
- Queries the database for all published statements and user profiles
- Generates a properly formatted XML sitemap
- Saves it to `public/sitemap.xml`
- Updates `public/robots.txt` to reference the sitemap

### 3. Dynamic API Route (Backup)
As a backup, there's also a dynamic sitemap route at `/sitemap.xml` that generates the sitemap on-demand.

## What's Included in the Sitemap

### Static Pages
- Homepage (`/`) - Priority: 1.0, Change frequency: daily
- Feed page (`/feed`) - Priority: 0.9, Change frequency: hourly
- Login page (`/login`) - Priority: 0.3, Change frequency: monthly
- Sign-up page (`/sign-up`) - Priority: 0.3, Change frequency: monthly

### Dynamic Content
- **Published Statements**: `/{username}/{statement-slug}` - Priority: 0.8, Change frequency: weekly
- **User Profiles**: `/{username}` - Priority: 0.6, Change frequency: weekly

## Manual Generation

You can manually generate the sitemap at any time:

```bash
yarn generate-sitemap
```

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SITE_URL`: Your site's base URL (defaults to `https://conject.io`)

### Customization
To add more pages or modify priorities, edit the `scripts/generate-sitemap.ts` file and update the static URLs array.

## SEO Benefits

- **Search Engine Discovery**: Helps search engines find and index all your content
- **Crawl Efficiency**: Provides change frequency hints to search engines
- **Priority Indication**: Tells search engines which pages are most important
- **Automatic Updates**: Ensures sitemap stays current without manual intervention

## Troubleshooting

### Pre-commit Hook Not Working
1. Ensure the hook is executable: `chmod +x .git/hooks/pre-commit`
2. Check that the `yarn generate-sitemap` command works manually
3. Verify your database connection is working

### Sitemap Generation Fails
1. Check your database connection string
2. Ensure all required environment variables are set
3. Verify the database schema matches the expected structure

### Large Sitemaps
If your sitemap grows very large (>50,000 URLs), consider:
- Implementing sitemap indexing (multiple sitemap files)
- Adding pagination to the dynamic route
- Filtering content by recency or importance 