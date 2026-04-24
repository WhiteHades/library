# Contributing to the Library

This guide explains how to contribute notes, series, and channels to the public library. Read it once and you will know exactly what to do.

## What This Is

The library is a curated digital garden for published notes on theology, philosophy, and apologetics. It is built with Eleventy and deployed on Vercel. Notes are written in Markdown with YAML frontmatter. The site owner publishes from a private Obsidian vault. Contributors send pull requests to the public `library` repository.

## The Two-Repo Setup

- `library` (this repo, public): where the site is built and deployed. All PRs go here.
- `Knowledge` (private): the site owner's Obsidian vault. After your PR merges, a bot syncs your note back to this vault so the owner can edit it later.

You only need to interact with `library`.

## Prerequisites

- Git and a GitHub account
- Basic Markdown and YAML frontmatter knowledge
- Node.js 22.x (only if you want to run the build locally)

## How to Contribute

### Option A: Pull Request (for technical contributors)

1. Fork this repository
2. Create your note in `src/site/notes/00_publish/{idea}/`
3. Use the templates below
4. Run `npm test` and `npm run build` locally (optional but recommended)
5. Open a PR against `main`

### Option B: GitHub Issue (for non-technical contributors)

1. Open a new issue using the "Propose a New Note" template
2. Paste your note content (markdown plus frontmatter)
3. A maintainer will review and create the PR on your behalf

## Note Template

Every note needs this exact structure:

```markdown
---
{"dg-publish":true,"dg-path":"{idea}/{slug}.md","permalink":"/{idea}/{slug}/","title":"{Title}","dg-note-properties":{"type":"note","created":"YYYY-MM-DDTHH:mm","page_kind":"note","channel":"{channel-key}","author":"{Your Name}","series":"{channel}/{series-key}","order":{N},"ideas":["[[{idea}]]"],"contexts":[],"project":null,"before":"{prev-note-slug}","after":"{next-note-slug}","title":"{Title}","sources":[{"title":"Source Title","url":"https://example.com"}]}}
---

# {Title}

## quick read
-
-
-

---

## reading path

{body content}
```

## Frontmatter Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `page_kind` | Yes | `note` for content notes, `idea-overview` for hub pages |
| `channel` | Yes | Must match a key in `channels.json` |
| `author` | Yes | Your name, or the content author's name |
| `title` | Yes | Display title |
| `dg-publish` | Yes | Must be `true` |
| `series` | Conditional | Required if this note belongs to a series |
| `order` | Conditional | Required if `series` is set. Integer, 1-based |
| `before` | Conditional | Wikilink to previous note in series |
| `after` | Conditional | Wikilink to next note in series |
| `ideas` | Yes | Array of wikilinks. First entry is the primary idea |
| `sources` | No | Array of `{title, url}` objects |
| `permalink` | Yes | URL path. Format: `/{idea}/{slug}/` |

## Content Rules

1. Every note must have a `## quick read` section with exactly 3 bullet points
2. The quick read section must be followed by a horizontal rule `---`
3. Use Obsidian wikilinks `[[note-name|Display Text]]` for internal links
4. Sources go in frontmatter, not inline text
5. Do not use `## note` as a heading

## Adding a New Series

A complete PR for a new series must include:

1. All series notes in `src/site/notes/00_publish/{idea}/`
2. Updated `src/site/_data/publish/series.json` with the new series entry
3. Updated `before`/`after` on adjacent notes if this series connects to existing content
4. Updated `home.json` if the series should be featured

## Adding a New Channel

A complete PR for a new channel must include:

1. Updated `src/site/_data/publish/channels.json`
2. Logo asset in `src/site/img/channels/` (PNG or SVG, square, at least 64x64)
3. At least one note using the new channel key

## Adding a New Idea

A complete PR for a new idea must include:

1. New folder `src/site/notes/00_publish/{idea}/`
2. `overview.md` hub page with `page_kind: idea-overview`
3. At least one content note
4. Updated `home.json` if the idea should be featured

## Commit Message Conventions

- `content:` New or updated notes
- `feat:` New structural features (new channel, new series type)
- `fix:` Corrections to existing content
- `chore:` Registry updates, build artifacts, PDFs

## The PR Bot

Every PR is checked by an automated bot. It does not block your PR. It comments with a checklist of what is missing. Fix the issues, push new commits, and the bot will update its comment. When everything passes, it will say the PR is ready for merge.

The bot checks:
- Build passes (`npm run build`)
- Tests pass (`npm test`, 222 tests)
- Frontmatter is valid YAML
- Required fields are present
- Channel/series/idea keys exist in registries
- Sources are properly formatted
- `## quick read` section is present
- No conflicting permalinks
- PDFs are present for changed notes (or the pre-push hook will generate them)

## What Happens After Merge

1. The site redeploys automatically on Vercel
2. A bot syncs your note to the private editorial vault
3. The note becomes editable by the site owner in Obsidian
4. Static PDFs are generated for the new note on the next local build

## Local Development

```bash
git clone https://github.com/WhiteHades/library.git
cd library
npm install
npm test        # Run tests
npm run build   # Full build (requires Chromium for PDF generation)
```

The `.env` file is auto-managed by the Digital Garden plugin. Do not commit it. Do not modify it unless you know what you are doing.

## Questions?

Open an issue with the "Question" label.
