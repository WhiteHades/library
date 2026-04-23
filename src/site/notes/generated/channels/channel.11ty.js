class ChannelPage {
  data() {
    return {
      pagination: {
        data: "publish.channels",
        size: 1,
        alias: "channelEntry",
      },
      layout: "layouts/note.njk",
      templateEngineOverride: false,
      permalink: (data) => `/channels/${data.channelEntry.key}/`,
      "dg-publish": true,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
      eleventyComputed: {
        title: (data) => data.channelEntry.name,
        page_kind: () => "channel-page",
        channel: (data) => data.channelEntry.key,
      },
    };
  }

  render(data) {
    const channelPage = (data.publishModel.channels || []).find((item) => item.key === data.channelEntry.key) || null;
    const description = channelPage && channelPage.description ? `<p>${channelPage.description}</p>` : "";
    const sections = (channelPage?.ideas || []).map((idea) => {
      const seriesList = (idea.series || []).length
        ? `<h4>Series</h4><ul>${idea.series.map((series) => `<li><a href="${series.url}">${series.title}</a></li>`).join("")}</ul>`
        : "";
      const standaloneList = (idea.standalone || []).length
        ? `<h4>Standalone</h4><ul>${idea.standalone.map((note) => `<li><a href="${note.url}">${note.title}</a></li>`).join("")}</ul>`
        : "";
      return `<h3>${idea.title}</h3>${seriesList}${standaloneList}`;
    }).join("");

    return `
<h2 id="quick-read">quick read</h2>
<ul>
  <li>${data.channelEntry.name} is one of the source channels represented in this public library.</li>
  <li>This page groups the channel's work by idea first, then by series and standalone notes.</li>
  <li>Use this page when you want provenance-first browsing rather than idea-first browsing.</li>
</ul>
<h2 id="note">note</h2>
${description}
${sections}`;
  }
}

module.exports = ChannelPage;
