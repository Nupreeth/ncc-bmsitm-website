const fs = require("fs");
const path = require("path");

const sourceRoot =
  process.argv[2] ||
  "C:\\Users\\kaverappa\\Downloads\\NCC Website final pics for activities";

const destRoot = path.join(__dirname, "assets", "activities");
const outputFile = path.join(__dirname, "activities.json");

const validExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"]);
const heicExt = new Set([".heic", ".heif"]);

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

if (!fs.existsSync(sourceRoot)) {
  console.error(`Source folder not found: ${sourceRoot}`);
  process.exit(1);
}

if (fs.existsSync(destRoot)) {
  fs.rmSync(destRoot, { recursive: true, force: true });
}
fs.mkdirSync(destRoot, { recursive: true });

const eventFolders = fs
  .readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const events = [];

eventFolders.forEach((folderName) => {
  const folderPath = path.join(sourceRoot, folderName);
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => validExt.has(path.extname(file).toLowerCase()))
    .sort();

  if (!files.length) return;

  let modified = 0;
  files.forEach((file) => {
    try {
      const stat = fs.statSync(path.join(folderPath, file));
      if (stat.mtimeMs > modified) modified = stat.mtimeMs;
    } catch (err) {
      // ignore stat errors
    }
  });

  const slug = slugify(folderName) || "event";
  const destFolder = path.join(destRoot, slug);
  fs.mkdirSync(destFolder, { recursive: true });

  const mainIndex = files.findIndex((file) =>
    path.basename(file, path.extname(file)).toLowerCase() === "main"
  );

  const orderedFiles = [...files];
  if (mainIndex > -1) {
    const [mainFile] = orderedFiles.splice(mainIndex, 1);
    orderedFiles.unshift(mainFile);
  }

  const images = orderedFiles.map((file, index) => {
    const ext = path.extname(file).toLowerCase();
    const src = path.join(folderPath, file);
    const isHeic = heicExt.has(ext);
    const filename = `${String(index + 1).padStart(2, "0")}${isHeic ? ".jpg" : ext}`;
    const dest = path.join(destFolder, filename);

    if (isHeic) {
      const { spawnSync } = require("child_process");
      const script = [
        "from PIL import Image",
        "import pillow_heif",
        "import sys",
        "pillow_heif.register_heif_opener()",
        "src, dest = sys.argv[1], sys.argv[2]",
        "img = Image.open(src).convert('RGB')",
        "img.save(dest, 'JPEG', quality=90)"
      ].join("\n");
      const result = spawnSync("python", ["-c", script, src, dest], { stdio: "inherit" });
      if (result.status !== 0) {
        console.warn(`Failed to convert HEIC: ${src}`);
        return null;
      }
    } else {
      fs.copyFileSync(src, dest);
    }

    return `/assets/activities/${slug}/${filename}`;
  }).filter(Boolean);

  events.push({
    event: folderName,
    slug,
    images,
    modified
  });
});

const output = {
  last_updated: new Date().toISOString(),
  total_events: events.length,
  events: events.sort((a, b) => a.modified - b.modified)
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(`Imported ${events.length} events into ${outputFile}`);
