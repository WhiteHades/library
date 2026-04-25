# Contributing to the Library

This repo is for published notes.

Keep it simple. Match the format already used in the repo. If you are unsure, copy a nearby file and change only what needs changing.

### `Start Here`

- Put published notes in `src/site/notes/00_publish/{idea}/`
- Use YAML frontmatter with top-level keys (Digital Garden converts this to JSON on export)
- Use the right format for the page type you are adding
- Do not add `## reading path` unless a maintainer explicitly asks for it

### `What Most Contributors Will Submit`

Most PRs only need one of these:

1. a normal note
2. an idea overview page

The `home.md` page is editorial territory unless you were specifically asked to edit it.

### `Folder Shape`

Example:

```text
src/site/notes/00_publish/hinduism/
  overview.md
  01_hinduism_and_the_universal_claim.md
  02_defining_hinduism.md
```

### `Format 1: Normal Note`

Use this for an ordinary published note.

```markdown
---
type: note
created: 2026-04-24T12:00
page_kind: note
channel: dawahwise
author: Your Name
series: dawahwise/universal-truth
order: 8
sources:
  - title: "Source title"
    url: "https://example.com"
ideas:
  - "[[hinduism]]"
contexts: []
project:
before: hinduism/07_previous_note.md
after:
dg-publish: true
title: "Example Note"
---

# Example Note

## quick read

- First key takeaway.
- Second key takeaway.
- Third key takeaway.

---

Your note starts here.
```

What matters:

- all metadata is at the top level (not nested inside `dg-note-properties`)
- `page_kind` must be `note`
- `## quick read` is required for normal notes
- `## quick read` should have 3 short bullet points
- the horizontal rule `---` after `## quick read` is required
- `series`, `order`, `before`, and `after` are only needed if the note belongs to a series
- `sources` go in frontmatter, not in a loose list at the bottom
- `dg-publish: true` is required for Digital Garden to export the note

### `Format 2: Idea Overview`

Use this for `overview.md` inside an idea folder.

```markdown
---
type: note
created: 2026-04-24T00:00
page_kind: idea-overview
channel: mohammed-efaz
author: Your Name
sources: []
ideas:
  - "[[hinduism]]"
contexts: []
project:
dg-publish: true
title: "Hinduism"
---

# Hinduism

This page introduces the idea.

It should explain what the reader will find in this folder and where to start.
```

What matters:

- `page_kind` must be `idea-overview`
- no `## quick read` is required here
- no `## reading path` is required here
- keep it short and orient the reader

### `Format 3: Home Page`

Do not edit this unless you were asked.

```markdown
---
type: note
created: 2026-04-24T00:00
page_kind: home
channel: editorial
author: Site Owner
ideas: []
contexts: []
project:
dg-publish: true
title: "Home"
hide: true
tags:
  - gardenEntry
---
```

### `Required Fields At A Glance`

For a normal note:

- `page_kind`
- `channel`
- `author`
- `title`
- `dg-publish`

Usually also:

- `ideas`
- `sources`

Only when the note is in a series:

- `series`
- `order`
- `before`
- `after`

### `Rules That Matter`

- use YAML frontmatter with top-level keys (Digital Garden converts this to JSON on export)
- never nest metadata inside `dg-note-properties` in the source
- use a real channel key from `src/site/_data/publish/channels.json`
- use a real series key from `src/site/_data/publish/series.json` if you set `series`
- keep permalinks unique
- use Obsidian wikilinks for internal links
- do not invent a new format when the repo already has one
- do not add `## reading path` by default

### `Adding A New Idea`

If you add a new idea, include all of this in one PR:

1. the new folder in `src/site/notes/00_publish/{idea}/`
2. `overview.md`
3. at least one normal note in that folder

### `Adding A New Channel`

If you add a new channel, include all of this in one PR:

1. the `channels.json` entry
2. the logo in `src/site/img/channels/`
3. at least one note using that channel key

### `Adding A New Series`

If you add a new series, include all of this in one PR:

1. the notes themselves
2. the `series.json` entry
3. correct `series` and `order` values on the notes

### `Local Check`

If you want to test locally:

```bash
git clone https://github.com/WhiteHades/library.git
cd library
/home/efaz/.volta/bin/npm install
/home/efaz/.volta/bin/npm test
/home/efaz/.volta/bin/npm run build
```

### `After Merge`

- the site redeploys automatically via Vercel
- contributor notes live in the Library repo only
- metadata registries (`channels.json`, `series.json`) sync back to the source vault
- editorial oversight continues from the private source vault

### `If You Are Unsure`

Open an issue or copy the nearest real example from the same idea folder and adjust it carefully.
