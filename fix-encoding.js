const fs = require("fs");

const files = fs.readdirSync(__dirname).filter((file) => file.endsWith(".html"));

const replacements = [
  [/Â·/g, "&middot;"],
  [/Â©/g, "&copy;"],
  [/â€“/g, "&ndash;"],
  [/â€”/g, "&mdash;"],
  [/â†‘/g, "&uarr;"],
  [/â†’/g, "&rarr;"],
  [/Ã¢â‚¬â€/g, "&mdash;"],
  [/Ã¢â â/g, "&rarr;"],
  [/Ã¢Â†Â’/g, "&rarr;"],
  [/ÃÂ¢ÃÂÃÂ/g, "'"],
  [/ÃÂ¢ÃÂÃÂ/g, "&ndash;"],
  [/ÃÂ¢ÃÂÃÂ/g, "&mdash;"],
  [/Ã¢â‚¬â€/g, "&mdash;"],
  [/â€™/g, "&rsquo;"],
  [/ÃÂ¢ÃÂÃÂ/g, "&uarr;"],
  [/ÃÂÃÂ¢ÃÂ¢ÃÂÃÂ¬ÃÂ¢ÃÂÃÂ/g, "&mdash;"],
  [/ÃÂÃÂ¢ÃÂ¢ÃÂÃÂ/g, "&uarr;"],
  [/ÃÂÃÂ/g, ""]
];

files.forEach((file) => {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file);
  let content = raw.toString("latin1");
  content = Buffer.from(content, "latin1").toString("utf8");
  replacements.forEach(([pattern, value]) => {
    content = content.replace(pattern, value);
  });
  content = content.replace(/See Full Timeline[^<]*<\/a>/g, "See Full Timeline &rarr;</a>");
  content = content.replace(/@nccbmsit[^<]*2025-26/gi, "@nccbmsit &middot; 2025-26");
  fs.writeFileSync(file, content, "utf8");
});

console.log("Encoding fixes applied.");
