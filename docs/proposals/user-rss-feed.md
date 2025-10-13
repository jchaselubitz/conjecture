# User RSS Feed Proposal

## Overview
Provide a per-user RSS feed that mirrors the content visible on `/[userSlug]`. Readers could subscribe to updates from any writer directly from their profile page while respecting existing publication permissions.

## Objectives
- Deliver an RSS feed endpoint for every writer without duplicating data fetching logic.
- Ensure the feed only exposes published statements (or drafts visible to the requesting collaborator when authenticated).
- Keep the feed performant through caching and edge-friendly streaming.
- Maintain discoverability by linking to the feed in user pages and metadata.

## Proposed Endpoint
Create an App Router route handler at `app/[userSlug]/rss/route.ts` that serves `application/rss+xml` responses. The handler should:
1. Resolve the `userSlug` parameter and fetch the related profile via `userProfileCache`.
2. Reuse `getStatementsCached({ creatorId, publishedOnly: true })` to retrieve the visible statements for that profile.
3. Filter drafts so only content with `draft.publishedAt` is exposed publicly, matching the logic in `app/[userSlug]/page.tsx`.
4. Build RSS XML using a lightweight helper (for example the `rss` npm package) or a small custom serializer to avoid heavy dependencies.
5. Return a cached response with `Cache-Control` headers such as `s-maxage=300, stale-while-revalidate=60`.

The route's shape will be compatible with static generation or incremental revalidation, allowing CDN caching. When a statement is published, call `revalidatePath('/' + userSlug + '/rss')` alongside existing page revalidation to flush stale feeds.

## Feed Structure
- **Channel metadata**: writer name, bio or subtitle if available, absolute link to their profile, and avatar as the channel image.
- **Items** (one per statement):
  - `title`: statement title.
  - `link`: canonical URL such as `https://conject.com/${userSlug}/${statement.slug}`.
  - `guid`: stable value like `${statement.statementId}:${draft.versionNumber}` to support updates.
  - `pubDate`: `draft.publishedAt`.
  - `description`: short HTML summary from `statement.subtitle` or truncated `draft.contentPlainText`.
  - `content:encoded`: optional full HTML body when available and safe to expose.
  - `author`: primary collaborators marked as authors.
  - `category`: optional tags if available from statement metadata.

## Surfacing the Feed
- Inject `<link rel="alternate" type="application/rss+xml">` in `generateMetadata` for `app/[userSlug]/page.tsx` so feed readers can autodiscover the feed.
- Add a small "Subscribe via RSS" button or icon on the user profile page, pointing to `/${userSlug}/rss`.

## Permissions & Privacy
- Public readers receive only published statements. Collaborators visiting the feed while authenticated could optionally view unpublished drafts, but only if we can assert their permissions via session cookies in the route handler. For the initial release, keep the feed public-only.
- Ensure unlisted or private statements are excluded by aligning filtering logic with `StatementListContainer` (requires a published draft and collaborator check).

## Testing Strategy
- **Unit**: XML serializer producing valid RSS given mock data.
- **Integration**: Route handler returns 200 with correct headers and feeds data from Supabase using seeded fixtures.
- **End-to-end**: Browser test verifying the "Subscribe via RSS" link exists and the RSS endpoint renders expected XML for a known user.
- **Validation**: Run the generated feed through an RSS validator (for example the W3C Feed Validation Service) as part of QA.

## Rollout Plan
1. Implement the route handler and helper utilities.
2. Add metadata link and UI affordance on the user profile page.
3. Update publishing flows to revalidate the RSS path.
4. Document the feature in release notes and marketing materials.

## Future Enhancements
- Support Atom or JSON Feed variants alongside RSS.
- Allow custom feed filters (for example topics, collaborators).
- Expose per-thread feeds and organization-level feeds using similar infrastructure.

