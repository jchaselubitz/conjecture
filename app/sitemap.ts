import { MetadataRoute } from 'next';

import db from '@/lib/database';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = 'https://conject.io';

  try {
    const urls: MetadataRoute.Sitemap = [
      // Static pages
      {
        url: `${BASE_URL}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${BASE_URL}/feed`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9
      },
      {
        url: `${BASE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3
      },
      {
        url: `${BASE_URL}/sign-up`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
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
          url: `${BASE_URL}/${statement.creatorSlug}/${statement.slug}`,
          lastModified: statement.updatedAt || statement.publishedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.8
        });
      }
    }

    // Get user profiles that have at least one published statement
    const userProfiles = await db
      .selectFrom('profile')
      .innerJoin('statement', 'profile.id', 'statement.creatorId')
      .innerJoin('draft', 'statement.statementId', 'draft.statementId')
      .select(['profile.username as username', 'profile.updatedAt as updatedAt'])
      .where('profile.username', 'is not', null)
      .where('draft.publishedAt', 'is not', null)
      .distinct()
      .execute();

    // Add user profile URLs
    for (const profile of userProfiles) {
      if (profile.username) {
        urls.push({
          url: `${BASE_URL}/${profile.username}`,
          lastModified: profile.updatedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.6
        });
      }
    }

    return urls;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least the static pages if database query fails
    return [
      {
        url: `${BASE_URL}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${BASE_URL}/feed`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9
      }
    ];
  }
}
