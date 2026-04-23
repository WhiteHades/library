class SeriesPage {
  data() {
    return {
      pagination: {
        data: "publish.series",
        size: 1,
        alias: "seriesEntry",
      },
      layout: "layouts/note.njk",
      templateEngineOverride: false,
      permalink: (data) => `/series/${data.seriesEntry.key}/`,
      "dg-publish": true,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
      eleventyComputed: {
        title: (data) => data.seriesEntry.title,
        page_kind: () => "series-page",
        channel: (data) => data.seriesEntry.channel,
        series: (data) => data.seriesEntry.key,
      },
    };
  }

  render(data) {
    const seriesPage = data.publishModel.seriesMap[data.seriesEntry.key] || null;
    const description = seriesPage && seriesPage.description ? `<p>${seriesPage.description}</p>` : "";
    const readingPath = (seriesPage?.notes || []).map((note) => `<li><a href="${note.url}">${note.title}</a></li>`).join("");

    return `
<h2 id="quick-read">quick read</h2>
<ul>
  <li>${data.seriesEntry.title} is an ordered reading path generated from the series registry and note sequence metadata.</li>
  <li>This page is the canonical landing page for the series.</li>
  <li>Use the notes below to read in sequence.</li>
</ul>
<h2 id="note">note</h2>
${description}
<h3>Reading Path</h3>
<ul>${readingPath}</ul>`;
  }
}

module.exports = SeriesPage;
