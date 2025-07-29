# Automatic Sitemap Generation

This project includes an automatic sitemap generation system that creates your sitemap.xml file during the build process for production deployments.

## How It Works

### 1. Build-Time Generation
The sitemap is automatically generated during the build process (when running `yarn build`, `yarn build-prod`, etc.). This ensures your sitemap is always up-to-date with the latest content when deployed.

### 2. Static Generation Script
The `scripts/generate-sitemap.ts` script:
- Queries the database for all published statements and user profiles
- Generates a properly formatted XML sitemap
- Saves it to `public/sitemap.xml`
- Updates `public/robots.txt` to reference the sitemap

### 3. Dynamic API Route (Backup)
As a backup, there's also a dynamic sitemap route at `/sitemap.xml` that generates the sitemap on-demand.

### 4. Environment-Aware
- **Local Development**: Uses `.env.local` for database connection
- **Production**: Uses production environment variables from Netlify

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

## Build Process Integration

The sitemap is automatically generated during these build commands:
- `yarn build` - Standard Next.js build
- `yarn build-prod` - Production Netlify build
- `yarn build-dev` - Development Netlify build
- `yarn build-branch` - Branch deployment build
- `yarn build-staging` - Staging build

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SITE_URL`: Your site's base URL (defaults to `https://conject.io`)

### Customization
To add more pages or modify priorities, edit the `scripts/generate-sitemap.ts` file and update the static URLs array.

## SEO Benefits

- **Search Engine Discovery**: Helps search engines find and index all your content
- **Crawl Efficiency**: Provides change frequency hints to search engines
- **Priority Indication**: Tells search engines which pages are most important
- **Automatic Updates**: Ensures sitemap stays current with every deployment
- **Production-Ready**: Generated fresh for each production build with latest content

## Troubleshooting

### Build Process Issues
1. Check that the `yarn generate-sitemap` command works manually
2. Verify your database connection is working
3. Ensure environment variables are properly set in your deployment platform

### Sitemap Generation Fails
1. Check your database connection string
2. Ensure all required environment variables are set
3. Verify the database schema matches the expected structure

### Large Sitemaps
If your sitemap grows very large (>50,000 URLs), consider:
- Implementing sitemap indexing (multiple sitemap files)
- Adding pagination to the dynamic route
- Filtering content by recency or importance 