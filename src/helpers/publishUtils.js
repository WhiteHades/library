const slugify = require("@sindresorhus/slugify");

function getField(data, key) {
  if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
    return data[key];
  }

  const noteProps = data["dg-note-properties"];
  if (noteProps && noteProps[key] !== undefined && noteProps[key] !== null && noteProps[key] !== "") {
    return noteProps[key];
  }

  return null;
}

function parseIdeaKey(ideas) {
  if (!Array.isArray(ideas) || ideas.length === 0) return null;
  const value = ideas[0];
  if (typeof value !== "string") return null;

  let normalized = value.trim();
  if (!normalized) return null;
  if (normalized.startsWith("[[") && normalized.endsWith("]]")) {
    normalized = normalized.slice(2, -2);
  }
  normalized = normalized.replace(/\\\|/g, "|").split("|")[0].trim();
  normalized = normalized.replace(/\.md$/i, "");
  normalized = normalized.split("/").pop();
  return normalized || null;
}

function humanizeKey(key) {
  if (!key) return "";
  return key
    .split("/")
    .pop()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getPageKind(item) {
  if (getField(item.data, "page_kind")) return getField(item.data, "page_kind");
  if (item.data.tags && item.data.tags.includes("gardenEntry")) return "home";
  return "note";
}

function candidateRefs(item) {
  const refs = new Set();
  const dgPath = item.data["dg-path"];
  if (typeof dgPath === "string" && dgPath.trim()) {
    refs.add(dgPath);
    refs.add(dgPath.replace(/\.md$/i, ""));
  }

  const stem = item.filePathStem.replace(/^\/notes\//, "");
  refs.add(`${stem}.md`);
  refs.add(stem);
  refs.add(item.url);
  return refs;
}

function normalizePublishedNote(item) {
  const data = item.data || {};
  const ideas = getField(data, "ideas") || [];

  return {
    title: data.title || item.fileSlug,
    url: item.url,
    filePathStem: item.filePathStem,
    dgPath: data["dg-path"] || null,
    pageKind: getPageKind(item),
    ideaKey: parseIdeaKey(ideas),
    channelKey: getField(data, "channel"),
    seriesKey: getField(data, "series"),
    order: Number(getField(data, "order")) || null,
    before: getField(data, "before"),
    after: getField(data, "after"),
    hide: Boolean(data.hide),
    hideInGraph: Boolean(data.hideInGraph),
    sourceIdeas: ideas,
    item,
    refs: candidateRefs(item),
  };
}

function resolveReference(reference, notes) {
  if (!reference || typeof reference !== "string") return null;
  const normalized = reference.trim().replace(/^\/notes\//, "");
  return notes.find((note) => note.refs.has(normalized) || note.refs.has(normalized.replace(/\.md$/i, ""))) || null;
}

function sortByOrderTitle(a, b) {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
}

function buildSeriesChain(seriesNotes) {
  const notes = [...seriesNotes].sort(sortByOrderTitle);
  const noteByUrl = new Map(notes.map((note) => [note.url, note]));

  const heads = notes.filter((note) => {
    const prev = resolveReference(note.before, notes);
    return !prev || !noteByUrl.has(prev.url);
  }).sort(sortByOrderTitle);

  const ordered = [];
  const visited = new Set();

  const walk = (start) => {
    let current = start;
    while (current && !visited.has(current.url)) {
      visited.add(current.url);
      ordered.push(current);
      current = resolveReference(current.after, notes);
    }
  };

  heads.forEach(walk);
  notes.filter((note) => !visited.has(note.url)).sort(sortByOrderTitle).forEach(walk);

  return ordered.map((note, index) => ({ ...note, sequenceIndex: index + 1 }));
}

function buildPublishModel(data) {
  const channelDefs = ((data.publish && Array.isArray(data.publish.channels)) ? data.publish.channels : []).filter(
    (channel) => channel && typeof channel === "object" && channel.key
  );
  const seriesDefs = ((data.publish && Array.isArray(data.publish.series)) ? data.publish.series : []).filter(
    (series) => series && typeof series === "object" && series.key
  );
  const homeConfig = (data.publish && data.publish.home) ? data.publish.home : {};

  const channelMap = Object.fromEntries(channelDefs.map((channel) => [channel.key, {
    ...channel,
    sourceUrl: channel.url || null,
    url: `/channels/${channel.key}/`,
  }]));
  const registrySeriesMap = Object.fromEntries(seriesDefs.map((series) => [series.key, { ...series, url: `/series/${series.key}/`, slug: slugify(series.title || series.key) }]));

  const noteItems = (data.collections.note || []).map(normalizePublishedNote).filter((note) => note.item.data["dg-publish"] !== false);
  const contentNotes = noteItems.filter((note) => note.pageKind === "note");
  const ideaOverviewNotes = noteItems.filter((note) => note.pageKind === "idea-overview");

  const ideaMap = {};

  for (const overview of ideaOverviewNotes) {
    if (!overview.ideaKey) continue;
    ideaMap[overview.ideaKey] = {
      key: overview.ideaKey,
      title: overview.title,
      url: overview.url,
      overview,
      channels: [],
      series: [],
      standalone: [],
    };
  }

  for (const note of contentNotes) {
    if (!note.ideaKey) continue;
    if (!ideaMap[note.ideaKey]) {
      ideaMap[note.ideaKey] = {
        key: note.ideaKey,
        title: humanizeKey(note.ideaKey),
        url: `/${note.ideaKey}/`,
        overview: null,
        channels: [],
        series: [],
        standalone: [],
      };
    }
  }

  const seriesChains = {};
  for (const series of seriesDefs) {
    const notes = contentNotes.filter((note) => note.seriesKey === series.key).sort(sortByOrderTitle);
    const orderedNotes = buildSeriesChain(notes);
    const channel = channelMap[series.channel] || null;
    const idea = ideaMap[series.idea] || { key: series.idea, title: humanizeKey(series.idea), url: `/${series.idea}/` };

    seriesChains[series.key] = {
      ...series,
      url: `/series/${series.key}/`,
      channel,
      idea,
      notes: orderedNotes,
    };
  }

  for (const idea of Object.values(ideaMap)) {
    const ideaNotes = contentNotes.filter((note) => note.ideaKey === idea.key).sort(sortByOrderTitle);
    const ideaChannels = Array.from(new Set(ideaNotes.map((note) => note.channelKey))).filter(Boolean);
    const ideaSeries = seriesDefs
      .filter((series) => series.idea === idea.key)
      .map((series) => seriesChains[series.key])
      .filter(Boolean);
    const ideaStandalone = ideaNotes.filter((note) => !note.seriesKey).sort(sortByOrderTitle);

    idea.channels = ideaChannels
      .map((channelKey) => {
        const channel = channelMap[channelKey];
        const channelNotes = ideaNotes.filter((note) => note.channelKey === channelKey);
        return {
          ...(channel || { key: channelKey, name: humanizeKey(channelKey), url: `/channels/${channelKey}/` }),
          series: ideaSeries.filter((series) => series.channel && series.channel.key === channelKey),
          standalone: channelNotes.filter((note) => !note.seriesKey).sort(sortByOrderTitle),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    idea.series = ideaSeries.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    idea.standalone = ideaStandalone;
  }

  const channels = channelDefs.map((channel) => {
    const channelNotes = contentNotes.filter((note) => note.channelKey === channel.key).sort(sortByOrderTitle);
    const ideas = Array.from(new Set(channelNotes.map((note) => note.ideaKey))).filter(Boolean).map((ideaKey) => {
      const idea = ideaMap[ideaKey] || { key: ideaKey, title: humanizeKey(ideaKey), url: `/${ideaKey}/` };
      return {
        ...idea,
        series: Object.values(seriesChains).filter((series) => series.channel && series.channel.key === channel.key && series.idea && series.idea.key === ideaKey),
        standalone: channelNotes.filter((note) => note.ideaKey === ideaKey && !note.seriesKey).sort(sortByOrderTitle),
      };
    });

    return {
      ...channel,
      url: `/channels/${channel.key}/`,
      ideas: ideas.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" })),
      notes: channelNotes,
    };
  });

  const recentNotes = [...contentNotes]
    .sort((a, b) => new Date(b.item.data.created || 0) - new Date(a.item.data.created || 0))
    .slice(0, homeConfig.recentLimit || 12);

  const featuredIdeas = Object.values(ideaMap).filter((idea) => (homeConfig.featuredIdeas || []).includes(idea.key));
  const featuredChannels = channels.filter((channel) => (homeConfig.featuredChannels || []).includes(channel.key));
  const featuredSeries = Object.values(seriesChains).filter((series) => (homeConfig.featuredSeries || []).includes(series.key));

  return {
    channels,
    channelMap,
    series: Object.values(seriesChains),
    seriesMap: seriesChains,
    registrySeriesMap,
    featuredIdeas,
    featuredChannels,
    featuredSeries,
    ideas: Object.values(ideaMap).sort((a, b) => {
      const featured = homeConfig.featuredIdeas || [];
      const aIdx = featured.indexOf(a.key);
      const bIdx = featured.indexOf(b.key);
      if (aIdx !== -1 || bIdx !== -1) {
        return (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) - (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx);
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }),
    ideaMap,
    recentNotes,
    homeConfig,
  };
}

function makeNode({ key, label, url = null, type, children = [], active = false, defaultOpen = false }) {
  return {
    key,
    label,
    url,
    type,
    children,
    active,
    expandable: children.length > 0,
    defaultOpen,
    stateKey: `nav:${type}:${key}`,
  };
}

function buildNavigationTree(publishModel, currentUrl) {
  return publishModel.ideas.map((idea) => {
    const overviewNode = idea.overview
      ? makeNode({
          key: `${idea.key}:overview`,
          label: "Overview",
          url: idea.overview.url,
          type: "overview",
          active: currentUrl === idea.overview.url,
        })
      : null;

    const channelNodes = idea.channels.map((channel) => makeNode({
      key: channel.key,
      label: channel.name,
      url: `/channels/${channel.key}/`,
      type: "channel",
      active: currentUrl === `/channels/${channel.key}/`,
      children: [
        ...channel.series.map((series) => makeNode({
          key: series.key,
          label: series.title,
          url: series.url,
          type: "series",
          active: currentUrl === series.url,
          children: series.notes.map((note) => makeNode({
            key: note.url,
            label: note.title,
            url: note.url,
            type: "note",
            active: currentUrl === note.url,
          })),
        })),
        ...channel.standalone.map((note) => makeNode({
          key: note.url,
          label: note.title,
          url: note.url,
          type: "note",
          active: currentUrl === note.url,
        })),
      ],
    })).filter((node) => node.expandable || node.url);

    const seriesNodes = idea.series.map((series) => makeNode({
      key: series.key,
      label: series.title,
      url: series.url,
      type: "series",
      active: currentUrl === series.url,
      children: series.notes.map((note) => makeNode({
        key: note.url,
        label: note.title,
        url: note.url,
        type: "note",
        active: currentUrl === note.url,
      })),
    }));

    const standaloneNodes = idea.standalone.map((note) => makeNode({
      key: note.url,
      label: note.title,
      url: note.url,
      type: "note",
      active: currentUrl === note.url,
    }));

    const bucketNodes = [
      overviewNode,
      channelNodes.length ? makeNode({ key: `${idea.key}:channels`, label: "Channels", type: "bucket", children: channelNodes }) : null,
      seriesNodes.length ? makeNode({ key: `${idea.key}:series`, label: "Series", type: "bucket", children: seriesNodes }) : null,
      standaloneNodes.length ? makeNode({ key: `${idea.key}:standalone`, label: "Standalone", type: "bucket", children: standaloneNodes }) : null,
    ].filter(Boolean);

    const hasActiveChild = bucketNodes.some((node) => node.active || (node.children || []).some((child) => child.active || (child.children || []).some((grandChild) => grandChild.active)));

    return makeNode({
      key: idea.key,
      label: idea.title,
      url: null,
      type: "idea",
      active: currentUrl === idea.url,
      children: bucketNodes,
      defaultOpen: hasActiveChild || currentUrl === idea.url,
    });
  });
}

module.exports = {
  buildPublishModel,
  buildNavigationTree,
  getField,
  parseIdeaKey,
  humanizeKey,
};
