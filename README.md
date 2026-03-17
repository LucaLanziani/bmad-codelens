# BMAD Story CodeLens

VSCode/Cursor extension that adds CodeLens buttons above BMAD story headers for quick workflow actions.

## Features

### Epic files (`### Story X.Y: Title`)

Configurable action buttons appear above each story header:
- **Create Story** — runs `/bmad-bmm-create-story` (hidden when an implementation file already exists)
- **Copy Story** — copies the full story markdown to clipboard

A colored status indicator is shown when a matching implementation artifact file exists:

| Status | Indicator | Meaning |
|--------|-----------|---------|
| `ready-for-dev` | 🔵 ready-for-dev | Implementation file exists, development not started or in progress |
| `review` | 🟡 review | Story is in code review |
| `done` | 🟢 done | Story is complete |

### Story implementation files (`# Story X.Y: Title`)

A single status-dependent action button appears above the header:

| Status | Action | Command |
|--------|--------|---------|
| `ready-for-dev` | Dev Story | `/bmad-bmm-dev-story` |
| `review` | Code Review | `/bmad-bmm-code-review` |
| `done` | *(no action)* | — |

### How it works

Clicking a button opens the Copilot Chat panel with the slash command and story ID pre-filled. If chat is unavailable, the command is copied to the clipboard instead.

Status is resolved by matching story IDs to implementation artifact files (e.g. Story `1.1` matches `1-1-*.md` in `implementation-artifacts/`), then reading the `Status:` field from the file.

## Build & Install

```bash
# Install dependencies
npm install

# Compile TypeScript and package the .vsix
npm run release

# Install in Cursor
npm run install:cursor

# Or install in VSCode
npm run install:vscode
```

After installing, reload the editor window (`Cmd+Shift+P` → "Reload Window").

## Development

```bash
# Watch mode (recompiles on save)
npm run watch
```

Press **F5** from the workspace root to launch an Extension Host window with the extension loaded (uses the launch config in `.vscode/launch.json`).

## Configuration

Settings available under `bmadCodelens.*`:

| Setting | Default | Description |
|---------|---------|-------------|
| `bmadCodelens.enabled` | `true` | Enable/disable CodeLens buttons |
| `bmadCodelens.filePattern` | `**/*.md` | Glob for files to activate on |
| `bmadCodelens.actions` | *(see below)* | Action buttons for epic story headers |

### Default actions (epic files)

```json
[
  { "label": "Create Story", "commandPrefix": "/bmad-bmm-create-story", "behavior": "chat" },
  { "label": "Copy Story", "commandPrefix": "", "behavior": "clipboard" }
]
```

Set `behavior` to `"clipboard"` to copy to clipboard instead of opening chat.

## Versioning

Bump the version with `npm version` before releasing:

```bash
# Patch bump: 0.1.0 → 0.1.1
npm version patch

# Minor bump: 0.1.0 → 0.2.0
npm version minor

# Major bump: 0.1.0 → 1.0.0
npm version major
```

Then rebuild and reinstall:

```bash
npm run release
npm run install:cursor
```

## CI/CD

A GitHub Actions workflow is available at `.github/workflows/release.yml`. It can be triggered manually from the Actions tab:

1. Go to **Actions** → **Release Extension**
2. Click **Run workflow**
3. Select the version bump type (patch, minor, major)

The workflow compiles, packages, bumps the version, creates a git tag, and publishes a GitHub Release with the `.vsix` attached.

## Available npm scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile TypeScript to `out/` |
| `npm run watch` | Compile in watch mode |
| `npm run package` | Package into `.vsix` file |
| `npm run release` | Compile + package in one step |
| `npm run install:cursor` | Install the `.vsix` in Cursor |
| `npm run install:vscode` | Install the `.vsix` in VSCode |
