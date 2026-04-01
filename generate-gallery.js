const fs = require("fs");
const path = require("path");

const GALLERY_DIR = path.join(__dirname, "assets", "gallery");
const OUTPUT_FILE = path.join(__dirname, "gallery.json");
const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const categoryMap = [
  { key: "republic", category: "republic-day" },
  { key: "rdc", category: "rdc" },
  { key: "aitsc", category: "aitsc" },
  { key: "annual", category: "annual-review" },
  { key: "review", category: "annual-review" },
  { key: "camp", category: "camp" },
  { key: "parade", category: "parade" },
  { key: "blood", category: "blood-donation" },
  { key: "candle", category: "candle-march" },
  { key: "walk4lake", category: "walk4lake" },
  { key: "training", category: "training" },
  { key: "para", category: "para-basic" }
];

const titleCase = (value) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const inferCategory = (filename) => {
  const lower = filename.toLowerCase();
  for (const rule of categoryMap) {
    if (lower.includes(rule.key)) {
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

const run = () => {
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error(`Gallery folder not found: ${GALLERY_DIR}`);
    process.exit(1);
  }

  const files = walkDir(GALLERY_DIR)
    .filter((file) => VALID_EXTS.has(path.extname(file).toLowerCase()))
    .map((file) => path.relative(GALLERY_DIR, file))
    .sort((a, b) => a.localeCompare(b, "en"));

  const items = files.map((file) => {
    const name = path.basename(file, path.extname(file));
    const folder = path.dirname(file);
    const categoryFromFolder =
      folder && folder !== "." ? folder.split(path.sep)[0].toLowerCase() : null;
    return {
      src: `/assets/gallery/${file.replace(/\\/g, "/")}`,
      title: titleCase(name),
      category: categoryFromFolder || inferCategory(name)
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2));
  console.log(`gallery.json updated with ${items.length} items.`);
};

run();
