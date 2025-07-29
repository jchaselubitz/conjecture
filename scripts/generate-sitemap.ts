import db from "@/lib/database";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables from .env.local for local development
if (process.env.NODE_ENV !== "production") {
  config({ path: ".env.local" });
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://conject.io";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

async function generateSitemap() {
  console.log("Generating sitemap...");

  const urls: SitemapUrl[] = [
    // Static pages
    {
      loc: `${BASE_URL}/`,
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: `${BASE_URL}/feed`,
      changefreq: "hourly",
      priority: 0.9,
    },
    {
      loc: `${BASE_URL}/login`,
      changefreq: "monthly",
      priority: 0.3,
    },
    {
      loc: `${BASE_URL}/sign-up`,
      changefreq: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // Get all published statements
    const publishedStatements = await db
      .selectFrom("statement")
      .innerJoin("draft", "statement.statementId", "draft.statementId")
      .innerJoin("profile", "statement.creatorId", "profile.id")
      .select([
        "statement.slug",
        "statement.statementId",
        "profile.username as creatorSlug",
        "draft.publishedAt",
        "draft.updatedAt",
      ])
      .where("draft.publishedAt", "is not", null)
      .execute();

    console.log(`Found ${publishedStatements.length} published statements`);

    // Add statement URLs
    for (const statement of publishedStatements) {
      if (statement.creatorSlug && statement.slug) {
        urls.push({
          loc: `${BASE_URL}/${statement.creatorSlug}/${statement.slug}`,
          lastmod: statement.updatedAt?.toISOString() ||
            statement.publishedAt?.toISOString(),
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    }

    // Get all user profiles (for user pages)
    const userProfiles = await db
      .selectFrom("profile")
      .select(["username", "updatedAt"])
      .where("username", "is not", null)
      .execute();

    console.log(`Found ${userProfiles.length} user profiles`);

    // Add user profile URLs
    for (const profile of userProfiles) {
      if (profile.username) {
        urls.push({
          loc: `${BASE_URL}/${profile.username}`,
          lastmod: profile.updatedAt?.toISOString(),
          changefreq: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.warn(
      "Database connection failed, generating sitemap with static pages only",
    );
    console.warn(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  // Generate XML sitemap
  const sitemapXml = generateSitemapXml(urls);

  // Write to public directory
  const sitemapPath = join(process.cwd(), "public", "sitemap.xml");
  writeFileSync(sitemapPath, sitemapXml, "utf8");

  console.log(`Sitemap generated successfully at ${sitemapPath}`);
  console.log(`Total URLs: ${urls.length}`);

  // Update robots.txt to include sitemap
  updateRobotsTxt();
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const xmlUrls = urls.map((url) => {
    const lastmod = url.lastmod
      ? `\n    <lastmod>${url.lastmod}</lastmod>`
      : "";
    const changefreq = url.changefreq
      ? `\n    <changefreq>${url.changefreq}</changefreq>`
      : "";
    const priority = url.priority
      ? `\n    <priority>${url.priority}</priority>`
      : "";

    return `  <url>
    <loc>${url.loc}</loc>${lastmod}${changefreq}${priority}
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

function updateRobotsTxt() {
  const robotsPath = join(process.cwd(), "public", "robots.txt");
  const templatePath = join(process.cwd(), "public", "robots.txt.template");

  let robotsContent: string;

  try {
    // Try to read from template first
    const template = readFileSync(templatePath, "utf8");
    robotsContent = template.replace(
      "# Sitemap will be added automatically during build",
      `Sitemap: ${BASE_URL}/sitemap.xml`,
    );
  } catch (error) {
    // Fallback to default content
    robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;
  }

  writeFileSync(robotsPath, robotsContent, "utf8");
  console.log("Updated robots.txt with sitemap reference");
}

// Run the script
generateSitemap()
  .then(() => {
    console.log("Sitemap generation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Sitemap generation failed:", error);
    process.exit(1);
  });
