class ChannelsIndexPage {
  data() {
    return {
      permalink: "/channels/",
      layout: "layouts/note.njk",
      templateEngineOverride: false,
      title: "All Channels",
      page_kind: "channel-index",
      "dg-publish": true,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
    };
  }

  render(data) {
    const items = (data.publishModel.channels || [])
      .filter((channel) => !channel.hidden)
      .map((channel) => `<li><a href="/channels/${channel.key}/">${channel.name}</a></li>`)
      .join("\n");

    return `
<p>This page indexes all source channels currently represented in the public library. Channels are grouped separately from ideas so a reader can browse by provenance when needed.</p>
<ul>${items}</ul>`;
  }
}

module.exports = ChannelsIndexPage;
