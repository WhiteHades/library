# Contributing

### `Setup`

Install [GitHub CLI](https://cli.github.com) and authenticate:

```bash
gh auth login
```

### `Add a Note`

1. Fork and clone:

```bash
gh repo fork WhiteHades/library --clone
cd library
```

2. Copy the template:

```bash
cp templates/note.md src/site/notes/00_publish/your-idea/your-note.md
```

3. Edit the file. Match the format of nearby files.

4. Test:

```bash
npm test
```

5. Commit and push:

```bash
git add .
git commit -m "add: your note title"
git push origin main
```

6. Open a PR:

```bash
gh pr create --title "add: your note title" --body "Added note about..."
```

The bot checks your PR automatically. Fix any errors it reports.

### `Add a New Idea`

If the idea folder does not exist yet, also add:

- `src/site/notes/00_publish/your-idea/overview.md` (copy from `templates/overview.md`)
- At least one note in that folder

### `Rules`

- Use YAML frontmatter with top-level keys
- `dg-publish: true` is required
- `## quick read` with 3 bullets is required for normal notes
- Use existing channel keys from `src/site/_data/publish/channels.json`
- Do not add `## reading path`

Unsure? Copy the nearest real file and change only what needs changing.
