# Repository Guidelines

## Project Structure & Module Organization
The TypeScript sources live in `src/`, with `cli.ts` orchestrating argument parsing and delegating image work to `compress.ts`. Reusable utilities such as `sum.ts` stay alongside their Vitest specs (`*.test.ts`) to keep tests near the behavior they exercise. Command output defaults to the generated `out/` directory; remove or git-ignore artifacts there after manual runs. Configuration files at the project root (`tsconfig.json`, `biome.json`, `package.json`) define TypeScript, formatting, and package metadata — update them in sync when you introduce new tooling.

## Build, Test, and Development Commands
Use `pnpm install` once to hydrate dependencies. Run `pnpm compress -- ./path/to/image.jpg --quality 75` to execute the CLI through `tsx` with optional resize/format flags. `pnpm test` launches Vitest in run mode for quick assertions. `pnpm typecheck` validates types without emitting JS, and `pnpm check` applies Biome linting/formatting to `src/` so commit-ready code stays consistent.

## Coding Style & Naming Conventions
Follow Biome defaults: tab indentation, double quotes, and trailing commas where valid. Stick with TypeScript’s ES modules (`import`/`export`) and prefer descriptive file-level names (`compressImage`, `parseOptionalNumber`). CLI flags use lower camelCase (`--maxWidth`), mirroring option keys in code. Keep functions pure when possible and document non-obvious logic with concise comments.

## Testing Guidelines
Vitest is the required test runner; co-locate specs next to the modules they verify and name them `*.test.ts`. New features should include positive and edge-case coverage — for image helpers, mock sharp inputs or isolate format logic. Before opening a PR, run `pnpm test` and share the latest exit output. If you add async behavior, prefer `await expect(...).resolves` patterns to avoid false positives.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit shorthand: `<type>: <summary>` in lowercase (e.g., `feat: add webp preset`). Group related code, tests, and docs in a single commit when feasible. Pull requests should summarize the change, list verification commands, and reference any tracked issues. Include CLI usage notes or screenshots when modifying user-facing behavior so reviewers can reproduce the flow quickly.
