const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = path.join(__dirname, "tmp-instagram-nccbmsit");
const POSTS_JSON = path.join(
  SOURCE_ROOT,
  "your_instagram_activity",
  "media",
  "posts_1.json"
);
const GALLERY_ROOT = path.join(__dirname, "assets", "gallery");

const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const rules = [
  { keys: ["republic day", "#republicday", "flag hoisting", "flag hoist"], category: "republic-day" },
  { keys: ["rdc", "#rdc", "republic day camp", "rajpath"], category: "rdc" },
  { keys: ["aitsc", "#aitsc", "thal sainik"], category: "aitsc" },
  { keys: ["tsc", "#tsc", "thal sainik camp"], category: "tsc" },
  {
    keys: ["annual review", "gc visit", "group commander", "inspection", "annualreview"],
    category: "annual-review"
  },
  { keys: ["para basic", "parabasic", "#parabasic"], category: "para-basic" },
  { keys: ["blood donation", "blooddonation", "donation drive"], category: "blood-donation" },
  { keys: ["candle", "candle march", "candle light", "26/11"], category: "candle-march" },
  { keys: ["walk4lake", "walk for lake", "walk4 lake"], category: "walk4lake" },
  {
    keys: ["training", "drill", "map reading", "weapon", "firing", "firing practice", "obstacle"],
    category: "training"
  },
  { keys: ["camp", "catc", "ebsb", "atc", "pre-rdc", "pre rdc", "pretsc", "pre tsc"], category: "camp" },
  { keys: ["parade", "#parade", "independence day", "id parade"], category: "parade" },
  {
    keys: [
      "swachh",
      "cleanliness",
      "plantation",
      "tree plantation",
      "fit india",
      "yoga",
      "rally",
      "marathon",
      "run",
      "awareness",
      "ek bharat",
      "walkathon"
    ],
    category: "outreach"
  }
];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const inferCategory = (text) => {
  const lower = (text || "").toLowerCase();
  for (const rule of rules) {
    if (rule.keys.some((key) => lower.includes(key))) {
      return rule.category;
    }
  }
  return "general";
};

const run = () => {
  if (!fs.existsSync(POSTS_JSON)) {
    console.error(`Missing posts JSON: ${POSTS_JSON}`);
    process.exit(1);
  }

  ensureDir(GALLERY_ROOT);

  const posts = JSON.parse(fs.readFileSync(POSTS_JSON, "utf8"));
  let copied = 0;
  let skipped = 0;
  const categoryStats = {};

  posts.forEach((post) => {
    const caption = post.title || post.caption || "";
    const category = inferCategory(caption);
    const mediaList = Array.isArray(post.media) ? post.media : [];

    if (!categoryStats[category]) {
      categoryStats[category] = { copied: 0, skipped: 0 };
    }

    mediaList.forEach((media, index) => {
      const uri = media.uri;
      if (!uri) return;

      const srcPath = path.join(SOURCE_ROOT, uri.replace(/\//g, path.sep));
      const ext = path.extname(srcPath).toLowerCase();
      if (!VALID_EXTS.has(ext)) {
        skipped += 1;
        categoryStats[category].skipped += 1;
        return;
      }
      if (!fs.existsSync(srcPath)) {
        skipped += 1;
        categoryStats[category].skipped += 1;
        return;
      }

      const timestamp = media.creation_timestamp || post.creation_timestamp || Date.now();
      const baseName = `${timestamp}_${index}_${path.basename(srcPath)}`;
      const targetDir = path.join(GALLERY_ROOT, category);
      ensureDir(targetDir);
      const targetPath = path.join(targetDir, baseName);

      if (fs.existsSync(targetPath)) {
        skipped += 1;
        categoryStats[category].skipped += 1;
        return;
      }

      fs.copyFileSync(srcPath, targetPath);
      copied += 1;
      categoryStats[category].copied += 1;
    });
  });

  console.log(`Imported ${copied} images. Skipped ${skipped}.`);
  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`${category}: +${stats.copied} / skip ${stats.skipped}`);
  });
};

run();
