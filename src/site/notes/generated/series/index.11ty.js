class SeriesIndexPage {
  data() {
    return {
      permalink: "/series/",
      layout: "layouts/note.njk",
      templateEngineOverride: false,
      title: "All Series",
      page_kind: "series-index",
      "dg-publish": true,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
    };
  }

  render(data) {
    const items = (data.publishModel.series || [])
      .map((series) => `<li><a href="${series.url}">${series.title}</a></li>`)
      .join("\n");

    return `
<p>This page indexes all reading series currently represented in the public library. Series are grouped separately from ideas and channels so a reader can follow a focused reading path.</p>
<ul>${items}</ul>`;
  }
}

module.exports = SeriesIndexPage;
