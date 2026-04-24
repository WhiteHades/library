---
applyTo: "src/site/notes/**/*.md"
---

# Note Review Instructions

When reviewing Markdown notes in this repository, apply these content-specific checks.

## Frontmatter Validation

Every note must have valid YAML frontmatter. Check for:

- `page_kind`: must be `note` or `idea-overview`
- `channel`: must match a key in `src/site/_data/publish/channels.json`
- `author`: must be a non-empty string (the actual writer, not the site owner)
- `title`: must be a non-empty string
- `dg-publish`: must be `true`
- `series`: if present, must match a key in `src/site/_data/publish/series.json`
- `order`: required when `series` is set, must be an integer
- `permalink`: must be unique across all notes
- `sources`: if present, must be an array of `{title, url}` objects

## Content Structure

For `page_kind: note`:

1. Must contain `## quick read` section
2. `## quick read` must have exactly 3 bullet points starting with `-`
3. Must contain a horizontal rule `---` after quick read
4. Must not use `## note` as a heading

For `page_kind: idea-overview`:

1. Quick read section is optional
2. Should provide an overview of the idea and link to related notes

## Completeness Checks

When a new idea folder is added:

- Must contain `overview.md` with `page_kind: idea-overview`
- Must contain at least one content note

When a new series is added:

- All series notes must be present in `src/site/notes/00_publish/{idea}/`
- `series.json` must be updated with the new series entry
- `before` and `after` wikilinks must connect adjacent notes

When a new channel is added:

- `channels.json` must be updated
- Logo asset must exist in `src/site/img/channels/`
- At least one note must use the new channel key

## Link Validation

- Internal links use Obsidian wikilink syntax: `[[note-name|Display Text]]`
- Verify that linked notes actually exist
- External links in sources must have valid URLs

## Common Issues to Flag

- Missing required frontmatter fields
- Unknown channel or series keys
- Duplicate permalinks
- Malformed sources (missing title or url)
- Quick read with fewer or more than 3 bullets
- Missing horizontal rule after quick read
- Incomplete PRs (missing overview, missing registry updates)

## Tone

Be direct and specific. Quote only what is needed. Do not use emojis or em dashes.

For each finding, use this exact format:

```text
Issue: <what is wrong>
Fix: <what to change and where>
```

Do not add a PR overview. Do not add a change summary. Keep the comment focused on the issue and the fix.
