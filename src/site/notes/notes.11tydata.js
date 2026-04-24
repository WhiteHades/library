require("dotenv").config();
const settings = require("../../helpers/constants");
const fs = require("fs");
const matter = require("gray-matter");
const { buildPublishModel, getField, parseIdeaKey, humanizeKey } = require("../../helpers/publishUtils");

const allSettings = settings.ALL_NOTE_SETTINGS;
const defaultSettings = settings.DEFAULT_NOTE_SETTINGS;
const NON_FICTION_BASE_WPM = 238;
const DEFAULT_AUTHOR = "Mohammed Efaz";

function getSourcePlatform(url) {
  if (typeof url !== "string" || !url.trim()) {
    return { key: "website", label: "Website" };
  }

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtube.com" || hostname === "youtu.be" || hostname.endsWith("youtube.com")) {
      return { key: "youtube", label: "YouTube" };
    }

    if (hostname === "twitter.com" || hostname === "x.com" || hostname.endsWith("twitter.com") || hostname.endsWith("x.com")) {
      return { key: "x", label: "X" };
    }

    if (hostname === "github.com" || hostname.endsWith("github.com")) {
      return { key: "github", label: "GitHub" };
    }

    return { key: "website", label: hostname.replace(/^m\./, "") };
  } catch {
    return { key: "website", label: "Website" };
  }
}

function normalizeSources(data) {
  const rawSources = Array.isArray(data.sources)
    ? data.sources
    : (Array.isArray(data["dg-note-properties"]?.sources) ? data["dg-note-properties"].sources : []);

  return rawSources
    .filter((source) => source && typeof source === "object" && source.url)
    .map((source) => ({
      ...source,
      platform: getSourcePlatform(source.url),
    }));
}

function normalizeSequenceReference(reference) {
  if (!reference) return null;

  const value = Array.isArray(reference) ? reference[0] : reference;
  if (typeof value !== "string") return null;

  let normalized = value.trim();
  if (!normalized) return null;

  if (normalized.startsWith("[[") && normalized.endsWith("]]")) {
    normalized = normalized.slice(2, -2);
  }

  normalized = normalized.replace(/\\\|/g, "|").split("|")[0].trim();
  normalized = normalized.replace(/^\/notes\//, "");
  normalized = normalized.replace(/^\.\//, "");

  return normalized;
}

function buildSequenceCandidates(item) {
  const candidates = new Set();

  const addCandidate = (value) => {
    if (!value || typeof value !== "string") return;
    candidates.add(value);
    candidates.add(value.replace(/\.md$/i, ""));
  };

  const stem = item.filePathStem?.replace(/^\/notes\//, "");
  addCandidate(stem);
  addCandidate(item.data?.["dg-path"]);
  addCandidate(item.url);
  addCandidate(item.fileSlug);

  return candidates;
}

function resolveSequenceNote(reference, data) {
  const normalized = normalizeSequenceReference(reference);
  if (!normalized || !data.collections?.note) return null;

  const match = data.collections.note.find((item) => {
    const candidates = buildSequenceCandidates(item);
    return candidates.has(normalized) || candidates.has(normalized.replace(/\.md$/i, ""));
  });

  if (!match) return null;

  return {
    title: match.data?.title || match.fileSlug,
    url: match.url,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readNoteMarkdown(inputPath) {
  if (!inputPath) return "";

  try {
    const raw = fs.readFileSync(inputPath, "utf8");
    return matter(raw).content || "";
  } catch {
    return "";
  }
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\|/g, " ")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWords(text) {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
}

function countSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (matches && matches.length) return matches.length;
  return text.trim() ? 1 : 0;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(seconds) {
  const roundedMinutes = Math.max(1, Math.ceil(seconds / 60));
  return `~${roundedMinutes} min`;
}

function toPdfUrl(url, prefix = "") {
  if (typeof url !== "string" || !url.startsWith("/")) return null;
  const trimmed = url.replace(/\/$/, "");
  return `/pdf${prefix}${trimmed || "/index"}.pdf`;
}

function parseWikilinkLabel(value) {
  if (typeof value !== "string") return null;

  let normalized = value.trim();
  if (!normalized) return null;

  if (normalized.startsWith("[[") && normalized.endsWith("]]")) {
    normalized = normalized.slice(2, -2);
  }

  normalized = normalized.replace(/\\\|/g, "|");
  if (normalized.includes("|")) {
    normalized = normalized.split("|")[1] || normalized.split("|")[0];
  }

  normalized = normalized
    .replace(/\.md$/i, "")
    .split("/")
    .pop()
    .replace(/[_-]+/g, " ")
    .trim();

  if (!normalized) return null;

  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
}

function getPageKind(data) {
  return getField(data, "page_kind") || ((data.tags || []).includes("gardenEntry") ? "home" : "note");
}

function computeReadingStats(markdown) {
  const readableText = stripMarkdown(markdown);
  const words = extractWords(readableText);
  const wordCount = words.length;

  if (!wordCount) {
    return {
      wordCount: 0,
      wordCountLabel: "0",
      sentenceCount: 0,
      effectiveWpm: NON_FICTION_BASE_WPM,
      readingSeconds: 0,
      readingTimeLabel: "0 sec",
    };
  }

  const sentenceCount = countSentences(readableText);
  const headingCount = (markdown.match(/^#{1,6}\s+/gm) || []).length;
  const listItemCount = (markdown.match(/^\s*(?:[-*+]|\d+\.)\s+/gm) || []).length;
  const blockquoteCount = (markdown.match(/^>\s?/gm) || []).length;
  const inlineCodeCount = (markdown.match(/`[^`]+`/g) || []).length;
  const totalCharacterCount = words.reduce((sum, word) => sum + word.length, 0);
  const complexWordCount = words.filter((word) => word.length >= 7).length;

  const averageWordLength = totalCharacterCount / wordCount;
  const averageSentenceLength = wordCount / Math.max(sentenceCount, 1);
  const technicalDensity = complexWordCount / wordCount;

  let speedFactor = 1;
  speedFactor -= clamp((averageWordLength - 4.7) * 0.035, 0, 0.16);
  speedFactor -= clamp((averageSentenceLength - 20) * 0.008, 0, 0.12);
  speedFactor -= clamp((technicalDensity - 0.18) * 0.6, 0, 0.12);
  speedFactor -= clamp((inlineCodeCount / Math.max(sentenceCount, 1)) * 0.015, 0, 0.08);

  const effectiveWpm = Math.max(160, Math.round(NON_FICTION_BASE_WPM * speedFactor));
  const structuralPauseSeconds = (headingCount * 1.8) + (listItemCount * 0.75) + (blockquoteCount * 0.4);
  const readingSeconds = Math.round((wordCount / effectiveWpm) * 60 + structuralPauseSeconds);

  return {
    wordCount,
    wordCountLabel: formatCount(wordCount),
    sentenceCount,
    effectiveWpm,
    readingSeconds,
    readingTimeLabel: formatDuration(readingSeconds),
  };
}

module.exports = {
  eleventyComputed: {
    layout: (data) => {
      if (data.layout === false) {
        return false;
      }
      if (data.layout) {
        return data.layout;
      }
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "layouts/index.njk";
      }
      return "layouts/note.njk";
    },
    permalink: (data) => {
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "/";
      }
      return data.permalink || undefined;
    },
    basesNotes: (data) => {
      if (!data.collections || !data.collections.note) return [];
      return data.collections.note.map((item) => ({
        path: item.filePathStem.replace("/notes/", ""),
        url: item.url,
        metadata: item.data,
        fileSlug: item.fileSlug,
      }));
    },
    settings: (data) => {
      const noteSettings = {};
      allSettings.forEach((setting) => {
        let noteSetting = data[setting];
        let settingValue;
        if (noteSetting !== undefined && noteSetting !== null) {
          settingValue = noteSetting;
        } else {
          settingValue = defaultSettings[setting];
        }
        noteSettings[setting] = settingValue;
      });
      return noteSettings;
    },
    pageKind: (data) => getPageKind(data),
    primaryIdeaKey: (data) => parseIdeaKey(getField(data, "ideas") || []),
    primaryIdeaInfo: (data) => {
      const model = buildPublishModel(data);
      const ideaKey = parseIdeaKey(getField(data, "ideas") || []);
      return ideaKey ? (model.ideaMap[ideaKey] || { key: ideaKey, title: humanizeKey(ideaKey), url: `/${ideaKey}/` }) : null;
    },
    channelInfo: (data) => {
      const model = buildPublishModel(data);
      const channelKey = getField(data, "channel");
      return channelKey ? (model.channelMap[channelKey] || { key: channelKey, name: humanizeKey(channelKey), url: `/channels/${channelKey}/` }) : null;
    },
    seriesInfo: (data) => {
      const model = buildPublishModel(data);
      const seriesKey = getField(data, "series");
      return seriesKey ? (model.seriesMap[seriesKey] || null) : null;
    },
    ideaLabels: (data) => {
      const ideas = Array.isArray(data.ideas)
        ? data.ideas
        : (Array.isArray(data["dg-note-properties"]?.ideas) ? data["dg-note-properties"].ideas : []);
      return ideas.map(parseWikilinkLabel).filter(Boolean);
    },
    sourceEntries: (data) => normalizeSources(data),
    authorName: (data) => getField(data, "author") || DEFAULT_AUTHOR,
    showChannelMetadata: (data) => {
      const channelKey = getField(data, "channel");
      return Boolean(channelKey && channelKey !== "mohammed-efaz");
    },
    rawNoteMarkdown: (data) => {
      const pageKind = getPageKind(data);
      if (!["note", "idea-overview"].includes(pageKind)) return "";
      return readNoteMarkdown(data.page?.inputPath);
    },
    notePdfUrl: (data) => {
      const pageKind = getPageKind(data);
      if (!["note", "idea-overview"].includes(pageKind)) return null;
      return toPdfUrl(data.page?.url);
    },
    readingStats: (data) => {
      const pageKind = getPageKind(data);
      if (pageKind !== "note") return null;
      return computeReadingStats(readNoteMarkdown(data.page?.inputPath));
    },
    moreFromSeries: (data) => {
      if (getPageKind(data) !== "note") return [];
      const model = buildPublishModel(data);
      const seriesKey = getField(data, "series");
      const currentUrl = data.page && data.page.url;
      if (!seriesKey || !model.seriesMap[seriesKey]) return [];
      return model.seriesMap[seriesKey].notes.filter((note) => note.url !== currentUrl).slice(0, 6);
    },
    moreFromChannel: (data) => {
      if (getPageKind(data) !== "note") return [];
      const model = buildPublishModel(data);
      const channelKey = getField(data, "channel");
      const currentUrl = data.page && data.page.url;
      const channel = channelKey ? model.channelMap[channelKey] : null;
      if (!channel) return [];
      const channelPage = model.channels.find((item) => item.key === channelKey);
      if (!channelPage) return [];
      return channelPage.notes.filter((note) => note.url !== currentUrl).slice(0, 6);
    },
    relatedIdeas: (data) => {
      if (getPageKind(data) !== "note") return [];
      const model = buildPublishModel(data);
      const currentIdeaKey = parseIdeaKey(getField(data, "ideas") || []);
      const channelKey = getField(data, "channel");
      const channelPage = model.channels.find((item) => item.key === channelKey);
      if (!channelPage) return [];
      return channelPage.ideas.filter((idea) => idea.key !== currentIdeaKey).slice(0, 6);
    },
    seriesPdfUrl: (data) => {
      const model = buildPublishModel(data);
      const seriesKey = getField(data, "series");
      if (!seriesKey || !model.seriesMap[seriesKey]) return null;
      return `/pdf/series/${seriesKey}.pdf`;
    },
    beforeNote: (data) => resolveSequenceNote(data.before ?? data["dg-note-properties"]?.before, data),
    afterNote: (data) => resolveSequenceNote(data.after ?? data["dg-note-properties"]?.after, data),
  },
};
