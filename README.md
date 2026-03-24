# BMad CodeLens

A VS Code / Cursor extension that integrates with the [BMad](https://docs.bmad-method.org/) AI-driven development workflow. It surfaces CodeLens action buttons directly above story headers in your markdown files, so you can trigger BMad AI agent commands.

<!-- TODO: add screenshot of the extension in action (epic file with CodeLens buttons) -->
![Extension overview](docs/images/overview.png)

## What it does

When you open a BMad **epic file** or a **story implementation file** in your editor, the extension reads story IDs and their statuses and injects clickable buttons (CodeLens) above each story header. Clicking a button opens GitHub Copilot Chat with the appropriate BMad slash command and story ID pre-filled or falls back to copying the command to the clipboard if chat is unavailable.

This removes the need to manually type story IDs and slash commands, keeping you in flow while working through a BMad sprint.

## Install

Download the latest `.vsix` from the [Releases](https://github.com/LucaLanziani/bmad-codelens/releases) page, then install it:

```bash
# VS Code
code --install-extension bmad-codelens-<version>.vsix

# Cursor
cursor --install-extension bmad-codelens-<version>.vsix
```

After installing, reload the editor window (`Cmd+Shift+P` → "Reload Window").

## Features

### Epic files (`### Story X.Y: Title`)

Configurable action buttons appear above each story header:
- **Create Story** — runs `/bmad-bmm-create-story` (hidden when an implementation file already exists)
- **Copy Story** — copies the full story markdown to clipboard

When a matching implementation artifact file exists, additional controls appear:
- A **status badge** showing the current story status
- A **Go to Story** button (hidden when status is `done`) that opens the implementation file

| Status | Badge | Meaning |
|--------|-------|---------|
| `ready-for-dev` | 🔵 ready-for-dev | Implementation file exists, development not started or in progress |
| `review` | 🟡 review | Story is in code review |
| `done` | 🟢 done | Story is complete |

### Story implementation files (`# Story X.Y: Title`)

<!-- TODO: add screenshot of story implementation file CodeLens button -->
![Story file CodeLens](docs/images/story-codelens.png)

A single status-dependent action button appears above the header:

| Status | Action | Command |
|--------|--------|---------|
| `ready-for-dev` | Dev Story | `/bmad-bmm-dev-story` |
| `review` | Code Review | `/bmad-bmm-code-review` |
| `done` | *(no action)* | — |

### How it works

Clicking a button opens the Copilot Chat panel with the slash command and story ID pre-filled. If chat is unavailable, the command is copied to the clipboard instead.

Status is resolved by matching story IDs to implementation artifact files (e.g. Story `1.1` matches `1-1-*.md` in `implementation-artifacts/`), then reading the `Status:` field from the file.

## Configuration

Settings available under `bmadCodelens.*`:

| Setting | Default | Description |
|---------|---------|-------------|
| `bmadCodelens.enabled` | `true` | Enable/disable CodeLens buttons |
| `bmadCodelens.outputFolder` | `_bmad-output` | Relative path to the BMad output folder that contains `implementation-artifacts/` |
| `bmadCodelens.bmadFolder` | `_bmad` | Relative path to the BMad installation folder. When this folder exists, the "Install BMad" status bar button is hidden. |
| `bmadCodelens.actions` | *(see below)* | List of CodeLens buttons shown above each story in epic files |
| `bmadCodelens.devStoryAction` | *(see below)* | Action shown on story implementation files with status `ready-for-dev` |
| `bmadCodelens.codeReviewAction` | *(see below)* | Action shown on story implementation files with status `review` |

### Action behaviors

Each action has a `behavior` field that controls what happens when the button is clicked:

| Behavior | Description |
|----------|-------------|
| `clipboard` | Copies the command to the clipboard |
| `chat` | Opens the **current** chat panel with the command pre-filled (user presses Enter to submit) |
| `chat-submit` | Opens the **current** chat panel and submits the command immediately |
| `new-chat` | Opens a **new** chat and pre-fills it with the command (user presses Enter to submit) |
| `new-chat-submit` | Opens a **new** chat and submits the command immediately |

> **Tip:** If chat is unavailable (e.g. the VS Code chat extension is not installed), any chat behavior falls back to copying the command to the clipboard.

### Customising actions

Each action object has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Button label shown in the CodeLens |
| `commandPrefix` | `string` | Slash command prefix (e.g. `/bmad-bmm-create-story`). Use an empty string to copy the full story text. |
| `behavior` | `string` | One of the behavior values listed above |

**Default `bmadCodelens.actions`:**

```json
[
  { "label": "Create Story", "commandPrefix": "/bmad-bmm-create-story", "behavior": "new-chat" },
  { "label": "Copy Story",   "commandPrefix": "",                        "behavior": "clipboard" }
]
```

**Default `bmadCodelens.devStoryAction`:**

```json
{ "label": "Dev Story", "commandPrefix": "/bmad-bmm-dev-story", "behavior": "new-chat" }
```

**Default `bmadCodelens.codeReviewAction`:**

```json
{ "label": "Code Review", "commandPrefix": "/bmad-bmm-code-review", "behavior": "new-chat" }
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions, development setup, testing, and release process.

