# flow-nodes

A visual editor for conversation flows, built with Vue 3 and Vue Flow. It loads a flow from a sample JSON payload, draws it as a top-down graph, and lets you view, add, edit, and delete the steps in it.

The project started as a frontend assessment, and its look is based on the design in the assessment PDF.

**Live demo:** https://vue-flowchart-test.vercel.app

## Features

- Draws the flow as a graph that lays itself out from top to bottom.
- Click a node, or press Enter on it, to open its details in a side drawer.
- The open node is saved in the URL (`?node=<id>`), so you can share a link to it.
- Edit a node's title and description. Changes are saved as you type.
- Edit an Add Comment node's comment.
- Edit a Send Message node's texts: add, change, or remove them.
- Attach images to a Send Message node, shown as tiles. Click a tile to remove the image.
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
│   ├── components/    # UI components: node card, drawer, node details, message editor, create form
│   │   └── ui/        # Shared building blocks: button, input, textarea, select, form field
│   ├── composables/   # Reusable logic: graph building, layout, selection, message drafts
│   ├── stores/        # Pinia store that holds the flow and all edits
│   ├── utils/         # Plain functions: graph data, node metadata, attachments, viewport, constants
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

Buttons and form fields come from shared components in `src/components/ui/`, so they look and behave the same everywhere:

- **`BaseButton`** has five variants: `primary`, `secondary` (the default), `danger`, `ghost`, and `ghost-danger`. It can show a leading icon, or be icon-only with a required label. Every variant has the same focus ring and disabled style.
- **`BaseInput`, `BaseTextarea`, and `BaseSelect`** share one look, a focus style, and an `invalid` state that sets both the red border and `aria-invalid`. `BaseTextarea` can grow with its content up to a set number of rows.
- **`FormField`** adds the label, error, and hint around a field and links them to it. Optional fields say "(optional)" in their label, so required is the default and nothing needs a separate marker.

### Architecture

- **The URL decides which node is open.** The drawer opens for the node in `?node=<id>`. Links work, a reload keeps the drawer open, and invalid or unselectable ids are removed from the URL. The URL is updated with `replace`, so clicking through nodes doesn't fill up the browser history.
- **The store is the single source of truth.** The API is read-only, so the data is fetched once and copied into Pinia. Adding, editing, and deleting all happen there, and a refetch can't overwrite your changes.
- **Content and structure are kept apart.** Cards read their title and description from the store, so an edit only re-renders that card. The graph is rebuilt, and laid out again, only when nodes are added or removed.
- **The + buttons are added after the graph is built.** `withInsertPoints` adds a + node after every step that can have a next step. Adding a node in the middle of a flow moves the existing next steps under the new node.
- **Edits are debounced.** Title and description changes are saved 300ms after you stop typing, so the graph doesn't update on every keystroke. An empty title isn't saved.
- **Business Hours is a condition.** It always comes with Success and Failure branches. The branches can't be opened, and there's no + button directly after Business Hours, only after its branches.
- **A message is one ordered list.** A Send Message node's texts and images are stored together in `payload`, and their order matters. The drawer shows texts and images in separate groups, and anything new goes at the end of the list.
- **Empty texts hold back message changes.** A text can't be empty. While one is, text changes aren't saved, and the Add message button is disabled. Leaving the node, or reloading the page, asks you to confirm first, because the held changes will be lost.
- **Images are saved straight away.** Adding or removing an image is saved immediately, even while a text is empty. Only images up to 25 MB are accepted. Other files are rejected with a message, and the valid files in the same batch are still added.
- **Uploads stay in the browser.** An uploaded image becomes a local `blob:` URL. It's released when the image is removed or its node is deleted.

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

## CI/CD

### Continuous integration

GitHub Actions runs quality checks on every pull request and on every push to `main`. You can also start a run by hand from the Actions tab.

The workflow (`.github/workflows/ci.yml`) runs three jobs in parallel. Each one shows up as its own check on a pull request:

| Job       | What it runs        |
| --------- | ------------------- |
| Lint      | `bun run lint`      |
| Typecheck | `bun run typecheck` |
| Test      | `bun run test:run`  |

Each job is built from small reusable actions in `.github/actions/`:

- **`setup`** installs Node 24 and the Bun version from `packageManager` in `package.json`, restores the package cache, and runs `bun install --frozen-lockfile`. The install fails if `bun.lock` is out of date.
- **`lint`**, **`typecheck`**, and **`test`** each run one script.

The workflow only has read access to the repository, and every third-party action is pinned to a full commit SHA. A new push to a pull request cancels that pull request's older runs.

There's no build job, because Vercel already builds every commit (see below) and reports the result as a check.

### Deployment

The app is deployed on [Vercel](https://vercel.com) through its GitHub integration:

- Every push to `main` is deployed to production.
- Every other branch and pull request gets a preview deployment.
- Vercel runs `bun run build`, serves `dist/`, and picks a Node version that matches `engines` in `package.json`.
- The result is reported on the commit as a **Vercel** check, so a broken build shows up next to the CI checks.

`vercel.json` rewrites `/api/processes` to the sample payload. It replaces the Vite proxy, which only exists during development.

To stop failing changes from being merged, turn on branch protection for `main` and require the **Lint**, **Typecheck**, **Test**, and **Vercel** checks.

## Known limitations

- **Edits aren't saved.** Changes live in the Pinia store, so reloading the page resets the flow. There's no API to save them to.
- **Uploaded images only live in memory.** They disappear when you reload the page.
- **Removing an image is instant.** There's no confirmation or undo.
- **Images can't be opened full size** from the drawer.
