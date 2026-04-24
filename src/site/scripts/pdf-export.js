(function() {
  function parseHtml(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function fetchDocument(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return parseHtml(await response.text());
  }

  function cloneSources(doc) {
    const sources = doc.querySelector(".sidebar-sources");
    return sources ? sources.cloneNode(true) : null;
  }

  function buildNoteArticle(doc) {
    const sourceMain = doc.querySelector("main.content");
    if (!sourceMain) {
      throw new Error("Could not locate note content");
    }

    const article = document.createElement("article");
    article.className = "pdf-export-note";
    article.innerHTML = sourceMain.innerHTML;
    article.querySelector(".note-context-grid")?.remove();
    article.querySelector(".note-sequence")?.remove();
    article.querySelector(".sidebar-export-actions")?.remove();
    article.querySelector(".toc")?.remove();

    const sources = cloneSources(doc);
    if (sources) {
      const header = article.querySelector("header");
      if (header) {
        header.insertAdjacentElement("afterend", sources);
      } else {
        article.prepend(sources);
      }
    }

    return article;
  }

  function prefixHeadingIds(container, prefix) {
    container.querySelectorAll("[id]").forEach((node) => {
      node.id = `${prefix}-${node.id}`;
    });

    container.querySelectorAll("a[href^='#']").forEach((link) => {
      const target = link.getAttribute("href");
      if (!target || target === "#") return;
      link.setAttribute("href", `#${prefix}-${target.slice(1)}`);
    });
  }

  function markReady() {
    const finalize = () => {
      document.body.classList.add("pdf-export-ready");
      window.__pdfReady = true;
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(finalize).catch(finalize);
      return;
    }

    finalize();
  }

  function renderError(root, error) {
    root.innerHTML = "";
    const block = document.createElement("div");
    block.className = "pdf-export-error";
    block.textContent = error instanceof Error ? error.message : String(error);
    root.appendChild(block);
    markReady();
  }

  async function loadNoteExport(config) {
    const root = document.getElementById(config.rootId || "pdf-export-root");
    if (!root) return;

    try {
      const doc = await fetchDocument(config.sourceUrl);
      const article = buildNoteArticle(doc);
      root.replaceChildren(article);
      markReady();
    } catch (error) {
      renderError(root, error);
    }
  }

  async function loadSeriesExport(config) {
    const root = document.getElementById(config.rootId || "pdf-export-root");
    if (!root) return;

    try {
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-series-export";

      const intro = document.createElement("section");
      intro.className = "pdf-export-series-header";

      const title = document.createElement("h1");
      title.textContent = config.title;
      intro.appendChild(title);

      if (config.description) {
        const description = document.createElement("p");
        description.textContent = config.description;
        intro.appendChild(description);
      }

      const toc = document.createElement("nav");
      toc.className = "pdf-series-toc";
      toc.setAttribute("aria-label", "Series table of contents");
      toc.innerHTML = '<h2>Contents</h2><ol class="pdf-series-toc-list"></ol>';
      const tocList = toc.querySelector(".pdf-series-toc-list");

      wrapper.appendChild(intro);
      wrapper.appendChild(toc);

      for (const [index, note] of (config.notes || []).entries()) {
        const doc = await fetchDocument(note.url);
        const article = buildNoteArticle(doc);
        const noteId = `series-note-${index + 1}`;
        article.id = noteId;
        prefixHeadingIds(article, noteId);

        const heading = article.querySelector(".note-display-title, h1, h2");
        const titleText = (heading && heading.textContent && heading.textContent.trim()) || note.title;

        const tocItem = document.createElement("li");
        tocItem.className = "pdf-series-toc-item pdf-series-toc-item-level-1";
        tocItem.innerHTML = `<a href="#${noteId}">${titleText}</a>`;
        tocList.appendChild(tocItem);

        article.querySelectorAll("h2, h3, h4").forEach((subheading) => {
          if (!subheading.id) return;
          const level = Number(subheading.tagName.slice(1));
          const subItem = document.createElement("li");
          subItem.className = `pdf-series-toc-item pdf-series-toc-item-level-${Math.max(2, level)}`;
          subItem.innerHTML = `<a href="#${subheading.id}">${subheading.textContent.trim()}</a>`;
          tocList.appendChild(subItem);
        });

        wrapper.appendChild(article);
      }

      root.replaceChildren(wrapper);
      markReady();
    } catch (error) {
      renderError(root, error);
    }
  }

  window.__loadNotePdfExport = loadNoteExport;
  window.__loadSeriesPdfExport = loadSeriesExport;
})();
