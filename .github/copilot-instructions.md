# Copilot Instructions

This repository is a curated digital garden built with Eleventy and deployed on Vercel. It is not a typical web application. The primary content is Markdown notes with YAML frontmatter.

## Repository Overview

- **Type**: Static site generator (Eleventy 3.x)
- **Runtime**: Node.js 22.x
- **Primary language**: Markdown with YAML frontmatter
- **Build tool**: Eleventy + Sass
- **Test framework**: Vitest
- **Deployment**: Vercel

## Build and Validation

Always run these commands in order when validating changes:

```bash
npm install          # Install dependencies
npm test             # Run Vitest suite (222 tests)
npm run get-theme    # Fetch Obsidian theme CSS
npm run build        # Full build: Eleventy + Sass + PDF generation
```

PDF generation requires Chromium and is skipped on Vercel. In CI, use:

```bash
npm run get-theme
npm run build:eleventy
npm run build:sass
```

## Content Structure

Notes live in `src/site/notes/00_publish/{idea}/`. Each note requires:

- Valid YAML frontmatter with required fields: `page_kind`, `channel`, `author`, `title`, `dg-publish`
- A `## quick read` section with exactly 3 bullet points
- A horizontal rule `---` after quick read
- Properly formatted sources as `{title, url}` objects in frontmatter

## Review Guidelines

When reviewing pull requests:

1. Check that frontmatter follows the schema defined in CONTRIBUTING.md
2. Verify `channel` exists in `src/site/_data/publish/channels.json`
3. Verify `series` exists in `src/site/_data/publish/series.json` if set
4. Ensure `## quick read` has exactly 3 bullet points
5. Check for duplicate permalinks across all notes
6. Validate that new ideas include an `overview.md` with `page_kind: idea-overview`
7. Confirm complete submissions: new series need all notes, new channels need logo assets
8. Flag incomplete PRs but guide the contributor toward completion

## Tone and Style

- Be helpful, concise, and professional
- Point to specific files and lines when flagging issues
- Suggest concrete fixes, not vague criticism
- Remember: the site owner has final merge authority

## What Not to Do

- Do not make commits or push changes to the PR branch
- Do not merge pull requests
- Do not suggest changes that violate the content rules in CONTRIBUTING.md
- Do not use emojis or em dashes in comments
