# Journal - Home Dashboard

An AI-powered workspace for investigative journalists featuring interactive node graph visualization and intelligent chat assistance.

## Features

### 🎨 Design System
- **Clean, minimal interface** using Inter font family
- **Consistent color palette** with monochrome base and accent colors
- **Responsive layout** that adapts to different screen sizes

### 🤖 AI Chat Sidebar (Left Panel)
- Interactive chat interface with AI assistant
- Contextual suggestions for investigation workflows
- Message history with user/assistant distinction
- Real-time typing indicators
- Sleek dark theme for reduced eye strain

### 📊 Interactive Node Graph (Center Panel)
- **Force-directed graph visualization** showing entity relationships
- **Multiple entity types:**
  - 🔵 Investigations
  - 🟡 Companies
  - 🟢 People
  - 🟣 Documents
  - 🔴 Events
  - 🔴 Locations
- **Interactive features:**
  - Click nodes to view details
  - Zoom and pan controls
  - Auto-fit to viewport
  - Connection highlighting
  - Detailed node information panel

### 🔍 Neural Search
- Powered by AI for semantic search
- Quick access search bar at the top
- Customizable search parameters
- Integration with entity graph

### 📈 Real-time Stats
- Live entity count
- Connection tracking
- Source analysis metrics

## Technology Stack

- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **react-force-graph-2d** - Interactive graph visualization
- **d3-force** - Physics simulation for graph layout

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd app/home
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
# or
yarn build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
app/home/
├── src/
│   ├── components/
│   │   ├── ChatSidebar.jsx      # AI chat interface
│   │   ├── ChatSidebar.css
│   │   ├── NodeGraph.jsx         # Graph visualization
│   │   └── NodeGraph.css
│   ├── App.jsx                   # Main application layout
│   ├── App.css
│   ├── main.jsx                  # Application entry point
│   └── styles.css                # Global styles
├── index.html                    # HTML template
├── vite.config.js               # Vite configuration
└── package.json                  # Dependencies

## Customization

### Adding New Entities to the Graph

Edit `src/components/NodeGraph.jsx` and modify the `sampleData` object:

```javascript
const sampleData = {
  nodes: [
    { id: 'new-node', name: 'New Entity', type: 'company', size: 15 }
  ],
  links: [
    { source: 'new-node', target: 'existing-node', label: 'relationship' }
  ]
};
```

### Changing Colors

Edit CSS variables in `src/styles.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --blue: #3b82f6;
  /* ... more variables */
}
```

### Chat AI Integration

Replace the simulated response in `ChatSidebar.jsx` with your AI API:

```javascript
const handleSend = async () => {
  const response = await fetch('your-api-endpoint', {
    method: 'POST',
    body: JSON.stringify({ message: userMessage })
  });
  const data = await response.json();
  // Handle response
};
```

## Features Roadmap

- [ ] Real-time collaboration
- [ ] Export graph as image/PDF
- [ ] Advanced filtering and search
- [ ] Timeline view for events
- [ ] Source document viewer
- [ ] Automated entity extraction
- [ ] Multi-graph workspaces

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
