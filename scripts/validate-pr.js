const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const NOTES_DIR = path.resolve(__dirname, "../src/site/notes");
const CHANNELS_PATH = path.resolve(__dirname, "../src/site/_data/publish/channels.json");
const SERIES_PATH = path.resolve(__dirname, "../src/site/_data/publish/series.json");

const REQUIRED_FIELDS = ["page_kind", "channel", "author", "title", "dg-publish"];

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function findMarkdownFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractNoteProps(data) {
  if (data["dg-note-properties"] && typeof data["dg-note-properties"] === "object") {
    return { ...data, ...data["dg-note-properties"] };
  }
  return data;
}

function findDuplicates(items, keyFn) {
  const seen = new Map();
  const duplicates = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      duplicates.push({ key, first: seen.get(key), second: item });
    } else {
      seen.set(key, item);
    }
  }
  return duplicates;
}

function validate() {
  const errors = [];
  const warnings = [];
  const channels = loadJson(CHANNELS_PATH);
  const series = loadJson(SERIES_PATH);

  if (!channels) {
    errors.push("Cannot load channels.json");
  }
  if (!series) {
    errors.push("Cannot load series.json");
  }

  if (channels) {
    const channelDups = findDuplicates(channels, (c) => c.key);
    for (const dup of channelDups) {
      errors.push(`channels.json: duplicate channel key "${dup.key}"`);
    }
  }

  if (series) {
    const seriesDups = findDuplicates(series, (s) => s.key);
    for (const dup of seriesDups) {
      errors.push(`series.json: duplicate series key "${dup.key}"`);
    }
  }

  const channelKeys = new Set((channels || []).map((c) => c.key));
  const seriesKeys = new Set((series || []).map((s) => s.key));

  const mdFiles = findMarkdownFiles(NOTES_DIR);
  const seenPermalinks = new Map();
  const seenPaths = new Map();
  const seenTitles = new Map();

  for (const file of mdFiles) {
    const relative = path.relative(NOTES_DIR, file);
    let parsed;
    try {
      parsed = matter(fs.readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${relative}: malformed frontmatter - ${e.message}`);
      continue;
    }

    const data = extractNoteProps(parsed.data);

    if (seenPaths.has(relative)) {
      errors.push(`${relative}: duplicate file path`);
    } else {
      seenPaths.set(relative, true);
    }

    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        errors.push(`${relative}: missing required field "${field}"`);
      }
    }

    if (data.channel && !channelKeys.has(data.channel)) {
      errors.push(`${relative}: unknown channel "${data.channel}"`);
    }

    if (data.series && !seriesKeys.has(data.series)) {
      errors.push(`${relative}: unknown series "${data.series}"`);
    }

    if (data.series && (data.order === undefined || data.order === null)) {
      errors.push(`${relative}: has "series" but missing "order"`);
    }

    if (data.permalink) {
      if (seenPermalinks.has(data.permalink)) {
        errors.push(`${relative}: duplicate permalink "${data.permalink}" (also in ${seenPermalinks.get(data.permalink)})`);
      } else {
        seenPermalinks.set(data.permalink, relative);
      }
    }

    if (data.title) {
      if (seenTitles.has(data.title)) {
        warnings.push(`${relative}: duplicate title "${data.title}" (also in ${seenTitles.get(data.title)})`);
      } else {
        seenTitles.set(data.title, relative);
      }
    }

    if (Array.isArray(data.sources)) {
      for (let i = 0; i < data.sources.length; i++) {
        const source = data.sources[i];
        if (!source || typeof source !== "object") {
          errors.push(`${relative}: sources[${i}] is not an object`);
        } else if (!source.title || !source.url) {
          errors.push(`${relative}: sources[${i}] missing "title" or "url"`);
        }
      }
    }

    const content = parsed.content;
    if (data.page_kind === "note") {
      if (!content.includes("## quick read")) {
        errors.push(`${relative}: missing "## quick read" section`);
      } else {
        const afterQuickRead = content.split("## quick read")[1];
        if (!afterQuickRead || !afterQuickRead.trim().startsWith("-")) {
          errors.push(`${relative}: "## quick read" section should contain bullet points`);
        }
      }

      if (!content.includes("\n---\n")) {
        errors.push(`${relative}: missing horizontal rule after quick read`);
      }
    }
  }

  if (warnings.length) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`  ! ${warning}`);
    }
    console.log("");
  }

  if (errors.length) {
    console.log("Validation failed:");
    for (const error of errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  } else {
    console.log(`Validation passed. ${mdFiles.length} note(s) checked.`);
    if (warnings.length) {
      console.log(`${warnings.length} warning(s) present.`);
    }
    process.exit(0);
  }
}

validate();
