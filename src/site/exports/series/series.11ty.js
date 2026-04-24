class SeriesPdfExportPage {
  data() {
    return {
      pagination: {
        data: "publish.series",
        size: 1,
        alias: "seriesEntry",
      },
      layout: false,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
      permalink: (data) => `/exports/series/${data.seriesEntry.key}/`,
      eleventyComputed: {
        title: (data) => `${data.seriesEntry.title} PDF`,
      },
    };
  }

  render(data) {
    const series = (data.publishModel && data.publishModel.seriesMap && data.publishModel.seriesMap[data.seriesEntry.key]) || data.seriesEntry;
    const notes = (series.notes || []).map((note) => ({
      title: note.title,
      url: note.url,
    }));

    return `<!DOCTYPE html>
<html lang="${data.meta.mainLanguage}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.seriesEntry.title || "Series"} PDF</title>
    <link href="/styles/style.css" rel="stylesheet">
    <link href="/styles/digital-garden-base.css" rel="stylesheet">
    <link href="/styles/custom-style.css" rel="stylesheet">
    <script defer src="/scripts/pdf-export.js"></script>
  </head>
  <body class="theme-light markdown-preview-view markdown-rendered markdown-preview-section pdf-export-body">
    <main class="content cm-s-obsidian pdf-export-content">
      <div id="pdf-export-root" class="pdf-export-loading">Preparing PDF...</div>
    </main>
    <script>
      window.__pdfReady = false;
      window.addEventListener("DOMContentLoaded", function() {
        window.__loadSeriesPdfExport({
          rootId: "pdf-export-root",
          title: ${JSON.stringify(data.seriesEntry.title || "Series")},
          description: ${JSON.stringify(series.description || "")},
          notes: ${JSON.stringify(notes)}
        });
      });
    </script>
  </body>
</html>`;
  }
}

module.exports = SeriesPdfExportPage;
