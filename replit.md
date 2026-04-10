# Project Overview

This is a Next.js 14 web application with Supabase authentication and Stripe subscription handling. It includes a research canvas interface and a notebook workspace.

## Architecture

- **Framework**: Next.js 14 (App Router, Turbopack)
- **Auth/DB**: Supabase
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons

## Key Routes

- `/` — Pricing/landing page
- `/canvas` — Infinite canvas research workspace with AI-powered search
- `/notebooks` — Notebook selection screen (grid of notebook cards)
- `/notebooks/[id]` — Notebook workspace (rich text editor + infinite canvas + file tree)
- `/account` — Account management
- `/signin` — Authentication

## Feature: Canvas (`/canvas`)

The canvas is a full-screen research workspace with:
- Infinite pan/zoom canvas (`components/ui/Canvas/InfiniteCanvas.tsx`)
- Cards that can be dragged and positioned on the canvas
- A collapsible sidebar with source management and to-do lists
- A chat panel with Exa/Browserbase search integration
- PDF and URL drag-and-drop support

Key components in `components/ui/Canvas/`:
- `InfiniteCanvas.tsx` — Main canvas controller with pan/zoom and card management
- `CanvasCard.tsx` — Individual draggable card
- `CanvasSidebar.tsx` — Left sidebar with sources and tasks
- `CanvasTopBar.tsx` — Floating top bar with breadcrumb and actions
- `ChatPanel.tsx` — AI-powered search panel
- `WritingSpacePanel.tsx`, `SourcesPanel.tsx`, `SidebarWritingCard.tsx`

## Feature: Notebooks (`/notebooks`)

A multi-pane notebook workspace with:
- Selection screen listing notebooks as cards with open-book animation on click
- Workspace with rich text editor (left ~60%) and tabbed panel (right ~40%)
- Canvas tab: freeform infinite canvas where users can double-click to create note cards, drag files from the Files tab
- Files tab: collapsible mock file tree with draggable file nodes

Key components in `components/ui/Notebook/`:
- `NotebookTopBar.tsx` — Top bar matching canvas aesthetic with back navigation
- `RichTextEditor.tsx` — Contenteditable rich text editor with formatting toolbar
- `NotebookCanvas.tsx` — Infinite canvas with file node graph, hover previews, node selection, and file-scoped search bar with `/search` Perplexity command
- `FileTree.tsx` — File tree with drag-to-canvas support, file upload & AI categorization, click-to-select-as-context
- `NotebookContext.tsx` — Shared React context for file tree state and selected file context across FileTree and NotebookCanvas
- `AgentCanvas.tsx` — Agent builder with drag-and-drop node graph
- `MultitaskerSidebar.tsx` — Collapsible task list sidebar

State is persisted via localStorage for user-created notebooks.

## File Node Graph & Agent Search (Task #16)

When files are uploaded and categorized in the FileTree:
- Files appear as interactive nodes on the canvas in a visual graph layout
- Folder nodes connect to child file nodes via dashed edges
- Hovering a node shows an animated floating preview with file name, type, and content snippet
- Clicking a file node selects it as agent context (highlighted with blue ring)
- A search bar appears at the top of the canvas panel when a file is selected
- Typing questions queries the agent (via `/api/notebook-agent-qa`) about the file's content
- Typing `/search` followed by a query triggers Perplexity web search (via `/api/perplexity-agent-search`) for external sources related to the file

## APIs

Located in `app/api/`:
- `/api/exa-search` — Exa search integration
- `/api/browserbase-search` — Browserbase web search
- `/api/parse-pdf` — PDF text extraction
- `/api/parse-docx` — DOCX text extraction
- `/api/fetch-link` — URL content extraction
- `/api/embed-similarity` — Embedding-based similarity for canvas connections
- `/api/categorize-files` — AI-powered file categorization using OpenAI embeddings + GPT-4o-mini
- `/api/perplexity-agent-search` — Perplexity web search with approved domain filter and file context
- `/api/notebook-agent-qa` — OpenAI GPT-4o-mini Q&A about selected file content

## Styling

- Tailwind CSS with `tailwindcss-animate`
- Global styles in `styles/main.css`
- Canvas/Notebook use clean white/light-gray palette with subtle borders, small sans-serif typography

## Environment

- Node.js with pnpm
- Dev server runs on port 5000
