require("dotenv").config();
const { globSync } = require("glob");

module.exports = async (data) => {
  let baseUrl = process.env.SITE_BASE_URL || "";
  if (baseUrl && !baseUrl.startsWith("http")) {
    baseUrl = "https://" + baseUrl;
  }

  const siteName = "Library";
  const authorName = process.env.SITE_AUTHOR_NAME || "";
  const authorUrl = process.env.SITE_AUTHOR_URL || "";
  const githubUrl = process.env.SITE_GITHUB_URL || "";

  let themeStyle = globSync("src/site/styles/_theme.*.css")[0] || "";

  // Check for logo file (supports multiple image formats)
  const logoFiles = globSync("src/site/logo.{png,jpg,jpeg,gif,svg,webp}");
  let logoPath = "";
  if (logoFiles.length > 0) {
    // Use the first match and convert to site-relative path
    logoPath = "/" + logoFiles[0].split("src/site/")[1];
  }
  if (themeStyle) {
    themeStyle = themeStyle.split("site")[1];
  }
  let bodyClasses = [];
  let noteIconsSettings = {
    filetree: false,
    links: false,
    title: false,
    default: "",
  };

  const styleSettingsCss = process.env.STYLE_SETTINGS_CSS || "";
  const styleSettingsBodyClasses = process.env.STYLE_SETTINGS_BODY_CLASSES || "";

  if (styleSettingsCss) {
    bodyClasses.push("css-settings-manager");
  }
  if (styleSettingsBodyClasses) {
    bodyClasses.push(styleSettingsBodyClasses);
  }

  let timestampSettings = {
    timestampFormat: "MMM dd, yyyy h:mm a",
    showCreated: false,
    showUpdated: false,
  };

  const uiStrings = {
    backlinkHeader: "Pages mentioning this page",
    noBacklinksMessage: "No other pages mentions this page",
    searchButtonText: "Search",
    searchPlaceholder: "Start typing...",
    searchNotStarted: "Enter your search text in the box above",
    searchEnterHotkey: "Enter",
    searchEnterHint: "to select",
    searchNavigateHotkey: "⇅",
    searchNavigateHint: "to navigate",
    searchCloseHotkey: "ESC",
    searchCloseHint: "to close",
    searchNoResults: "No results for",
    searchPreviewPlaceholder: "Select a result to preview",
    canvasDragHint: "Drag to pan",
    canvasZoomHint: "Scroll to zoom",
    canvasResetHint: "Double-click to reset",
  };

  const meta = {
    env: process.env.ELEVENTY_ENV,
    theme: "https://raw.githubusercontent.com/seanwcom/Red-Graphite-for-Obsidian/HEAD/theme.css",
    themeStyle,
    bodyClasses: bodyClasses.join(" "),
    noteIconsSettings,
    timestampSettings,
    baseTheme: "dark",
    siteName,
    authorName,
    authorUrl,
    githubUrl,
    siteLogoPath: logoPath,
    mainLanguage: "en",
    siteBaseUrl: baseUrl,
    styleSettingsCss,
    uiStrings,
    buildDate: new Date(),
  };

  return meta;
};
