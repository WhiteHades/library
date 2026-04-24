const fs = require("fs");
const path = require("path");
const http = require("http");
const { globSync } = require("glob");

const distDir = path.resolve(__dirname, "../dist");
const staticPdfDir = path.resolve(__dirname, "../src/site/pdf");

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js": return "application/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".woff": return "font/woff";
    case ".woff2": return "font/woff2";
    default: return "application/octet-stream";
  }
}

function resolveFilePath(requestPath) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^\/+/, "");
  let filePath = path.join(distDir, safePath);

  if (!filePath.startsWith(distDir)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  } else if (!path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    const indexPath = path.join(filePath, "index.html");
    if (fs.existsSync(htmlPath)) filePath = htmlPath;
    else filePath = indexPath;
  }

  return fs.existsSync(filePath) ? filePath : null;
}

function mapExportFileToPdf(file) {
  const relative = path.relative(distDir, file).replace(/\\/g, "/");
  if (relative.startsWith("exports/notes/")) {
    const output = relative.replace(/^exports\/notes\//, "").replace(/\/index\.html$/, ".pdf");
    return { urlPath: `/${relative.replace(/index\.html$/, "")}`, outputPath: path.join(distDir, "pdf", output) };
  }
  if (relative.startsWith("exports/series/")) {
    const output = relative.replace(/^exports\/series\//, "series/").replace(/\/index\.html$/, ".pdf");
    return { urlPath: `/${relative.replace(/index\.html$/, "")}`, outputPath: path.join(distDir, "pdf", output) };
  }
  return null;
}

async function generatePdfs() {
  const puppeteer = require("puppeteer");
  const exportFiles = globSync(path.join(distDir, "exports/**/index.html"));
  if (!exportFiles.length) return;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const filePath = resolveFilePath(url.pathname);

    if (!filePath) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  if (process.env.CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.CHROMIUM_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    for (const file of exportFiles) {
      const target = mapExportFileToPdf(file);
      if (!target) continue;

      fs.mkdirSync(path.dirname(target.outputPath), { recursive: true });
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${port}${target.urlPath}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__pdfReady === true, { timeout: 60000 });
      await page.emulateMediaType("print");
      await page.pdf({
        path: target.outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
      await page.close();

      // Persist to src/site/pdf for future Vercel deploys
      const staticPath = path.join(staticPdfDir, path.relative(path.join(distDir, "pdf"), target.outputPath));
      fs.mkdirSync(path.dirname(staticPath), { recursive: true });
      fs.copyFileSync(target.outputPath, staticPath);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    console.log("Skipping PDF generation on Vercel (Chromium unavailable). Using pre-built static PDFs.");
    return;
  }

  try {
    await generatePdfs();
  } catch (error) {
    console.warn("PDF generation failed, but continuing build. Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
