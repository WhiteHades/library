const { getField } = require("../../../helpers/publishUtils");

function getPageKind(data) {
  return getField(data, "page_kind") || ((data.tags || []).includes("gardenEntry") ? "home" : "note");
}

function exportUrlForNote(url) {
  const trimmed = (url || "/").replace(/^\//, "");
  return `/exports/notes/${trimmed}`;
}

class NotePdfExportPage {
  data() {
    return {
      pagination: {
        data: "collections.note",
        size: 1,
        alias: "noteEntry",
        before: (items) => items.filter((item) => {
          const pageKind = getPageKind(item.data || {});
          return ["note", "idea-overview"].includes(pageKind) && item.data["dg-publish"] !== false;
        }),
      },
      layout: false,
      eleventyExcludeFromCollections: true,
      hide: true,
      hideInGraph: true,
      permalink: (data) => exportUrlForNote(data.noteEntry.url),
      eleventyComputed: {
        title: (data) => `${data.noteEntry.data.title || data.noteEntry.fileSlug} PDF`,
      },
    };
  }

  render(data) {
    return `<!DOCTYPE html>
<html lang="${data.meta.mainLanguage}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.noteEntry.data.title || data.noteEntry.fileSlug} PDF</title>
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
        window.__loadNotePdfExport({
          rootId: "pdf-export-root",
          sourceUrl: ${JSON.stringify(data.noteEntry.url)}
        });
      });
    </script>
  </body>
</html>`;
  }
}

module.exports = NotePdfExportPage;
