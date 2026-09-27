# flow-nodes

A visual editor for conversation flows, built with Vue 3 and Vue Flow. It loads a flow from a sample JSON payload, draws it as a top-down graph, and lets you view, add, edit, and delete the steps in it.

The project started as a frontend assessment, and its look is based on the design in the assessment PDF.

**Live demo:** https://vue-flowchart-test.vercel.app

## Features

- Draws the flow as a graph that lays itself out from top to bottom.
- Click a node, or press Enter on it, to open its details in a side drawer.
- The open node is saved in the URL (`?node=<id>`), so you can share a link to it.
- Edit a node's title and description. Changes are saved as you type.
- Add a node with the **+** button at the end of a branch or between two steps.
- Delete a node. Its children move up to its parent.
- A Business Hours node comes with its own Success and Failure branches.
- Fully usable with a keyboard.

## Tech stack

| Area                   | Tools                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework              | [Vue 3](https://vuejs.org) with TypeScript                                                                                                                         |
| Build tool             | [Vite](https://vite.dev)                                                                                                                                           |
| Graph                  | [Vue Flow](https://vueflow.dev) for rendering, [dagre](https://github.com/dagrejs/dagre) for layout                                                                |
| State                  | [Pinia](https://pinia.vuejs.org)                                                                                                                                   |
| Data fetching          | [TanStack Query for Vue](https://tanstack.com/query/latest/docs/framework/vue/overview)                                                                            |
| Routing                | [Vue Router](https://router.vuejs.org) with file-based routes                                                                                                      |
| Styling                | [Tailwind CSS v4](https://tailwindcss.com) and [PrimeIcons](https://primevue.org/icons)                                                                            |
| Testing                | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com/docs/vue-testing-library/intro), [happy-dom](https://github.com/capricorn86/happy-dom) |
| Linting and formatting | [ESLint](https://eslint.org) with [@antfu/eslint-config](https://github.com/antfu/eslint-config)                                                                   |

## Project setup

### Requirements

- **[Bun](https://bun.sh) 1.4 or newer.** This project uses Bun as its package manager, and every command in this README uses it. Bun is also needed to commit, because the pre-commit hook runs through `bunx`. If you use a different package manager, swap in its commands, but note that `bun.lock` is the only lockfile, so other package managers won't install the exact same versions.
- **Node.js `^22.23.2`, `^24.18.1`, or `>=26.5.1`.** Vite, Vitest, and ESLint run on Node even when you start them through Bun. These are the first versions with the fixes from Node's July 2026 security release. **Node 24 (LTS) is recommended.** Older release lines, including Node 20, no longer get security fixes.

### Project structure

```
├── src/
│   ├── pages/         # Pages. Each file becomes a route (index.vue is "/")
│   ├── components/    # UI components: node card, drawer, node details, create form
│   ├── stores/        # Pinia store that holds the flow and all edits
│   ├── utils/         # Graph building, layout, node metadata, constants
│   ├── api/           # Fetching the flow data
│   ├── types/         # Types for the flow data
│   └── __tests__/
│       ├── unit/        # Tests for plain functions and the store
│       ├── components/  # Tests for single components
│       ├── pages/       # Tests for how the page ties everything together
│       ├── fixtures/    # Shared test data
│       └── helpers/     # Shared test setup
├── router.ts          # Router setup (routes come from src/pages)
├── vite.config.ts     # Vite, dev proxy, and Vitest settings
├── eslint.config.mjs  # Lint and formatting rules
└── vercel.json        # Deployment settings
```

### How it's configured

- **Vite** (`vite.config.ts`) uses three plugins: file-based routing from `vue-router`, Tailwind, and Vue.
- **Data source.** The app fetches the flow from `/api/processes`. In development, Vite's proxy forwards that path to a sample JSON payload, which gets around CORS. In production, `vercel.json` does the same with a rewrite.
- **TypeScript** is split into `tsconfig.app.json` for the app and `tsconfig.node.json` for `vite.config.ts`. `src/shims-vue.d.ts` lets plain TypeScript tools, like ESLint's type-aware rules, understand `.vue` imports. `vue-tsc` still uses each component's real types.
- **Tailwind** is loaded from `src/style.css`, next to Vue Flow's base styles.
- **Tests** run in Node by default. Tests that need a DOM switch to happy-dom with a `// @vitest-environment happy-dom` line at the top of the file. `src/__tests__/setup.ts` adds the jest-dom matchers, like `toHaveFocus()`.
- **ESLint** uses antfu's config with Vue accessibility rules, type-aware TypeScript rules, and formatting for CSS, HTML, and Markdown.
- **Git hooks.** Before each commit, `simple-git-hooks` runs `lint-staged`, which runs `eslint --fix` on the staged files.
- **VS Code.** `.vscode/` recommends the Vue and ESLint extensions and sets ESLint to fix files on save.

### How data flows

1. TanStack Query fetches the flow once.
2. The data is copied into the Pinia store. From then on, the store is the source of truth and holds every edit.
3. `computeGraph` turns the store's items into graph nodes and edges.
4. `withInsertPoints` adds the **+** nodes.
5. dagre works out the positions, and Vue Flow draws the graph.

## Design decisions

### Styling

Tailwind provides the utility classes, and the components use them to build their own look based on the assessment PDF. Each node type's color and icon are defined once in `NODE_META` (`src/utils/nodeMeta.ts`). The card, its edges, its selected and focus rings, and its **+** button all read from there, so a type always looks the same everywhere. Icons come from PrimeIcons.

### Architecture

- **The URL decides which node is open.** The drawer opens for the node in `?node=<id>`. Links work, a reload keeps the drawer open, and invalid or unselectable ids are removed from the URL. The URL is updated with `replace`, so clicking through nodes doesn't fill up the browser history.
- **The store is the single source of truth.** The API is read-only, so the data is fetched once and copied into Pinia. Adding, editing, and deleting all happen there, and a refetch can't overwrite your changes.
- **Content and structure are kept apart.** Cards read their title and description from the store, so an edit only re-renders that card. The graph is rebuilt, and laid out again, only when nodes are added or removed.
- **The + buttons are added after the graph is built.** `withInsertPoints` adds a + node after every step that can have a next step. Adding a node in the middle of a flow moves the existing next steps under the new node.
- **Edits are debounced.** Title and description changes are saved 300ms after you stop typing, so the graph doesn't update on every keystroke. An empty title isn't saved.
- **Business Hours is a condition.** It always comes with Success and Failure branches. The branches can't be opened, and there's no + button directly after Business Hours, only after its branches.

### Accessibility

- **Keyboard support.** Tab moves through the nodes and + buttons in top-to-bottom order. Enter or Space opens a node. Escape closes the drawer.
- **Focus management.** Opening the drawer moves focus into it. Closing it with Escape or the close button returns focus to the node or + button you started from.
- **Accessible names.** Every node has a label, like "Send Message: Welcome Message", and every + button says where it adds a node, like "Add node after Trigger". The create form tells screen readers where the new node will go.
- **Clear states.** Focused nodes show a lighter ring and selected nodes show a stronger one. Form errors are linked to their fields.

### Tooling

- **ESLint instead of Prettier.** This follows [antfu's reasoning](https://antfu.me/posts/why-not-prettier): one tool for linting and formatting, without Prettier's forced line wrapping.
- **Tests at three levels.** Unit tests cover plain functions and the store. Component tests cover each component on its own. Page tests check that the page connects everything correctly. Tests find elements by role and label, the way a user or screen reader would.

## Running the project

### 1. Install

```bash
git clone <repository-url>
cd flow-nodes
bun install
```

`bun install` also runs the `prepare` script, which sets up the pre-commit hook.

### 2. Start the dev server

```bash
bun run dev
```

Opens the app at http://localhost:5173 with hot reload. The dev server proxies `/api/processes` to the sample payload.

### 3. Build and preview

```bash
bun run build     # type-checks, then builds to dist/
bun run preview   # serves the built app locally
```

### 4. Run the tests

```bash
bun run test      # watch mode: re-runs tests when files change
bun run test:run  # runs all tests once, e.g. before pushing
```

Use `bun run test`, not `bun test`. `bun test` starts Bun's own test runner instead of Vitest, and these tests won't work with it.

### 5. Type-check

```bash
bun run typecheck
```

Runs `vue-tsc` on the app and on the Vite config.

### 6. Lint and format

```bash
bun run lint      # reports code and formatting problems
bun run lint:fix  # fixes whatever can be fixed automatically
```

There's no separate format command, because fixing lint problems also formats the code.

### 7. Commit

The pre-commit hook runs `eslint --fix` on your staged files.

### Scripts

| Script      | What it does                                                |
| ----------- | ----------------------------------------------------------- |
| `dev`       | Starts the dev server                                       |
| `build`     | Type-checks, then builds for production                     |
| `preview`   | Serves the production build locally                         |
| `test`      | Runs Vitest in watch mode                                   |
| `test:run`  | Runs all tests once                                         |
| `typecheck` | Type-checks the app and the Vite config                     |
| `lint`      | Checks linting and formatting                               |
| `lint:fix`  | Fixes linting and formatting problems                       |
| `prepare`   | Installs the git hooks. Runs automatically on `bun install` |

## Deployment

The app is deployed on [Vercel](https://vercel.com). Vercel detects Vite, runs `bun run build`, and serves `dist/`. It also picks a Node version that matches the `engines` field in `package.json`.

`vercel.json` rewrites `/api/processes` to the sample payload. It replaces the Vite proxy, which only exists during development.

## Known limitations

- **Edits aren't saved.** Changes live in the Pinia store, so reloading the page resets the flow. There's no API to save them to.
