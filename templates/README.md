# Contribution Templates

Copy these templates when adding new content.

## Quick Start

```bash
gh repo fork WhiteHades/library --clone
cd library
cp templates/note.md src/site/notes/00_publish/your-idea/your-note.md
```

## Templates

- `note.md` - Standard note with YAML frontmatter
- `overview.md` - Idea overview page
- `channel-entry.json` - Channel registry example
- `series-entry.json` - Series registry example

## Rules

- Match the format of nearby files
- Use existing channel keys from `channels.json`
- Use existing series keys from `series.json`
- Run `npm test` before submitting
