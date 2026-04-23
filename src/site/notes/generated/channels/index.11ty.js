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
      .map((channel) => `<li><a href="/channels/${channel.key}/">${channel.name}</a></li>`)
      .join("\n");

    return `
<h2 id="quick-read">quick read</h2>
<ul>
  <li>This page indexes all source channels currently represented in the public library.</li>
  <li>Channels are grouped separately from ideas so a reader can browse by provenance when needed.</li>
  <li>Each channel page is generated from the channel registry and note metadata.</li>
</ul>
<h2 id="note">note</h2>
<ul>${items}</ul>`;
  }
}

module.exports = ChannelsIndexPage;
