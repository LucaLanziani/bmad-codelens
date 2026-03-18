# Contributing

## Build & Install

```bash
# Install dependencies
npm install

# Compile TypeScript and package the .vsix
npm run release

# Install in Cursor
npm run install:cursor

# Or install in VS Code
npm run install:vscode
```

## Development

```bash
# Watch mode (recompiles on save)
npm run watch
```

Press **F5** from the workspace root to launch an Extension Host window with the extension loaded.

## Testing

Unit tests use [Vitest](https://vitest.dev/) and live in `src/__tests__/`. Fixtures are in `src/__tests__/fixtures/`.

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Versioning & Release

Bump the version with `npm version` before releasing:

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0
```

Then rebuild and reinstall locally:

```bash
npm run release
npm run install:cursor
```

A GitHub Actions workflow at `.github/workflows/release.yml` can be triggered manually from the Actions tab to bump the version, compile, package, tag, and publish a GitHub Release with the `.vsix` attached.

## Available npm scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile TypeScript to `out/` |
| `npm run watch` | Compile in watch mode |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run package` | Package into `.vsix` file |
| `npm run release` | Compile + package in one step |
| `npm run install:cursor` | Install the `.vsix` in Cursor |
| `npm run install:vscode` | Install the `.vsix` in VS Code |
