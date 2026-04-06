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
const IMPORT_PATTERN = /^\d+_\d+_/;

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

const walkDir = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
      return;
    }
    files.push(fullPath);
  });

  return files;
};

const buildFileIndex = () => {
  const files = walkDir(GALLERY_ROOT).filter((file) => VALID_EXTS.has(path.extname(file).toLowerCase()));
  const index = new Map();

  files.forEach((file) => {
    const name = path.basename(file);
    if (!IMPORT_PATTERN.test(name)) return;
    index.set(name, file);
  });

  return index;
};

const run = () => {
  if (!fs.existsSync(POSTS_JSON)) {
    console.error(`Missing posts JSON: ${POSTS_JSON}`);
    process.exit(1);
  }

  const fileIndex = buildFileIndex();
  if (!fileIndex.size) {
    console.log("No imported Instagram images found to recategorize.");
    return;
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_JSON, "utf8"));
  let moved = 0;
  let unchanged = 0;
  const stats = {};

  posts.forEach((post) => {
    const caption = post.title || post.caption || "";
    const category = inferCategory(caption);
    const mediaList = Array.isArray(post.media) ? post.media : [];

    if (!stats[category]) {
      stats[category] = { moved: 0, unchanged: 0 };
    }

    mediaList.forEach((media, index) => {
      const uri = media.uri;
      if (!uri) return;

      const timestamp = media.creation_timestamp || post.creation_timestamp || Date.now();
      const fileName = `${timestamp}_${index}_${path.basename(uri)}`;
      const currentPath = fileIndex.get(fileName);
      if (!currentPath) return;

      const currentFolder = path.basename(path.dirname(currentPath));
      if (currentFolder === category) {
        unchanged += 1;
        stats[category].unchanged += 1;
        return;
      }

      const targetDir = path.join(GALLERY_ROOT, category);
      ensureDir(targetDir);
      const targetPath = path.join(targetDir, fileName);

      if (!fs.existsSync(targetPath)) {
        fs.renameSync(currentPath, targetPath);
        moved += 1;
        stats[category].moved += 1;
      }
    });
  });

  console.log(`Recategorized ${moved} images. Unchanged ${unchanged}.`);
  Object.entries(stats).forEach(([category, value]) => {
    if (value.moved || value.unchanged) {
      console.log(`${category}: moved ${value.moved}, unchanged ${value.unchanged}`);
    }
  });
};

run();
