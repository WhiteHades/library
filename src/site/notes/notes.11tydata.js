require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;
const defaultSettings = settings.DEFAULT_NOTE_SETTINGS;

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

module.exports = {
  eleventyComputed: {
    layout: (data) => {
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
    beforeNote: (data) => resolveSequenceNote(data.before ?? data["dg-note-properties"]?.before, data),
    afterNote: (data) => resolveSequenceNote(data.after ?? data["dg-note-properties"]?.after, data),
  },
};
