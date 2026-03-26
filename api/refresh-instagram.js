/**
 * NCC BMSIT&M - Instagram Feed Refresh
 * Vercel Serverless Function called by cron daily at midnight IST (18:30 UTC)
 *
 * Does:
 *   1. Refreshes the long-lived Instagram access token (resets 60-day expiry)
 *   2. Fetches the latest 50 Instagram posts from @nccbmsit
 *   3. Filters to IMAGE and CAROUSEL_ALBUM types only (skips Reels)
 *   4. Writes the result to /public/data/instagram-posts.json
 *
 * Environment variables required (set in Vercel Dashboard > Settings > Environment Variables):
 *   INSTAGRAM_TOKEN      - Long-lived Instagram access token (set once manually)
 *   CRON_SECRET          - Random secret string to secure this endpoint
 *   DEPLOY_HOOK_URL      - Optional deploy hook to rebuild the site
 */

const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

module.exports = async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "INSTAGRAM_TOKEN not set in environment variables." });
  }

  try {
    const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`;
    const refreshRes = await fetch(refreshUrl);
    const refreshData = await refreshRes.json();

    if (!refreshData.access_token) {
      console.warn("Token refresh failed:", refreshData);
    } else {
      console.log("Token refreshed. New expiry in seconds:", refreshData.expires_in);
    }

    const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=50&access_token=${token}`;
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (!mediaData.data) {
      return res.status(500).json({ error: "Failed to fetch media", detail: mediaData });
    }

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const posts = mediaData.data
      .filter((post) => post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM")
      .filter((post) => new Date(post.timestamp) >= oneYearAgo)
      .map((post) => {
        const captionLines = (post.caption || "").split("\n").filter((line) => line.trim());
        const title = captionLines[0]
          ? captionLines[0].replace(/#\w+/g, "").trim().slice(0, 100)
          : "NCC BMSIT&M";

        const hashtags = (post.caption || "").match(/#\w+/g) || [];
        const tag = inferTag(hashtags);

        return {
          id: post.id,
          title,
          caption: post.caption || "",
          hashtags,
          tag,
          image: post.media_url,
          thumbnail: post.thumbnail_url || post.media_url,
          date: post.timestamp,
          link: post.permalink,
          type: post.media_type
        };
      });

    const output = {
      last_updated: new Date().toISOString(),
      total_posts: posts.length,
      source: "@nccbmsit",
      posts
    };

    const publicPath = join(process.cwd(), "public", "data");
    const rootPath = join(process.cwd(), "data");
    mkdirSync(publicPath, { recursive: true });
    mkdirSync(rootPath, { recursive: true });

    writeFileSync(join(publicPath, "instagram-posts.json"), JSON.stringify(output, null, 2));
    writeFileSync(join(rootPath, "instagram-posts.json"), JSON.stringify(output, null, 2));

    if (process.env.DEPLOY_HOOK_URL) {
      await fetch(process.env.DEPLOY_HOOK_URL, { method: "POST" });
      console.log("Redeploy triggered via deploy hook.");
    }

    return res.status(200).json({
      success: true,
      posts_fetched: posts.length,
      last_updated: output.last_updated
    });
  } catch (err) {
    console.error("Instagram refresh error:", err);
    return res.status(500).json({ error: err.message });
  }
};

function inferTag(hashtags) {
  const tags = hashtags.map((tag) => tag.toLowerCase());
  if (tags.some((tag) => ["#republicday", "#independenceday", "#annualreview", "#gcvisit", "#parade"].includes(tag))) {
    return "Ceremony";
  }
  if (tags.some((tag) => ["#rdc", "#aitsc", "#tsc", "#catc", "#parabasic", "#preigc", "#ebsb", "#atc"].includes(tag))) {
    return "Camp";
  }
  if (tags.some((tag) => ["#blooddonation", "#swachhbharat", "#fitindia", "#polioday", "#echs", "#yogaday"].includes(tag))) {
    return "Service";
  }
  if (tags.some((tag) => ["#walk4lake", "#plantation", "#greening", "#awarenessrally"].includes(tag))) {
    return "Outreach";
  }
  if (tags.some((tag) => ["#drill", "#training", "#parade", "#ncctraining", "#mapread"].includes(tag))) {
    return "Training";
  }
  if (tags.some((tag) => ["#achievement", "#award", "#commendation", "#dgncc", "#cmcommendation"].includes(tag))) {
    return "Achievement";
  }
  return "General";
}
