## What

<!-- Describe what this PR adds or changes -->

## Type

- [ ] New note
- [ ] New series
- [ ] New channel
- [ ] New idea
- [ ] Fix to existing content
- [ ] Structural change

## Checklist

- [ ] I have read CONTRIBUTING.md
- [ ] Frontmatter includes all required fields (`page_kind`, `channel`, `author`, `title`, `dg-publish`)
- [ ] `## quick read` section is present with exactly 3 bullet points
- [ ] Horizontal rule `---` follows the quick read section
- [ ] Channel key exists in `channels.json` (if new channel, included in PR)
- [ ] Series key exists in `series.json` (if applicable, included in PR)
- [ ] Idea folder and `overview.md` exist (if new idea, included in PR)
- [ ] Sources are properly formatted as `{title, url}` objects in frontmatter
- [ ] `npm test` passes locally
- [ ] `npm run build` passes locally (or I understand the bot will catch build errors)
