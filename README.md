# BMAD Story CodeLens

VSCode/Cursor extension that adds CodeLens buttons above BMAD story headers for quick workflow actions.

## Features

**Epic files** (`### Story X.Y: Title` headers) get configurable action buttons:
- Create Story, Dev Story, Copy Story

**Story implementation files** (`# Story X.Y: Title` + `Status:` line) get a status-dependent button:
- Status `done` → **Code Review** (`/bmad-bmm-code-review`)
- Any other status → **Dev Story** (`/bmad-bmm-dev-story`)

Clicking a button opens the Copilot Chat panel with the slash command pre-filled.

## Build & Install

```bash
cd tools/bmad-codelens

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
  { "label": "Dev Story", "commandPrefix": "/bmad-bmm-dev-story", "behavior": "chat" },
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

## Available npm scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile TypeScript to `out/` |
| `npm run watch` | Compile in watch mode |
| `npm run package` | Package into `.vsix` file |
| `npm run release` | Compile + package in one step |
| `npm run install:cursor` | Install the `.vsix` in Cursor |
| `npm run install:vscode` | Install the `.vsix` in VSCode |
