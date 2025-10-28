# Tribal Development Guide

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 to view the application.

## Features Implemented

✅ **Core Schema & Validation** - Zod-based type-safe graph schema  
✅ **React Flow Graph Renderer** - Interactive node/edge visualization  
✅ **Monaco Editor Integration** - Rich markup editing with live preview  
✅ **File I/O System** - Save/load .tribal.json files  
✅ **IndexedDB Persistence** - Auto-save functionality  
✅ **DSL Export** - Export graphs as .tribal text format  
✅ **Keyboard Shortcuts** - N (node), E (edge), Del (delete), Esc (deselect)  

## Usage

1. **Add Nodes**: Click "+ Node" or press `N`
2. **Add Edges**: Click "+ Edge" or press `E` (connects first two nodes)
3. **Edit Content**: Click any node/edge to edit its label and markup
4. **Connect Nodes**: Drag from node handles to create edges
5. **Save/Load**: Use toolbar buttons to save/load .tribal.json files
6. **Export DSL**: Export graph as human-readable .tribal text format

## Architecture

```
src/
├── core/          # Schema, serialization, parsing
├── renderer/      # React Flow components
├── ui/            # Editor panel and toolbar
└── App.tsx        # Main application
```

## Graph Format

Tribal graphs use a simple JSON schema:

```json
{
  "nodes": [
    {
      "id": "User",
      "label": "User", 
      "position": {"x": 100, "y": 100},
      "markup": "### User\nInitiates login process"
    }
  ],
  "edges": [
    {
      "id": "E1",
      "source": "User",
      "target": "API",
      "directed": true,
      "label": "Requests",
      "markup": "**HTTP POST** /auth/login"
    }
  ]
}
```

## DSL Format

Simplified text format for human/LLM editing:

```
# Graph: Authentication Flow

(User) -> (Frontend): Sends email
(Frontend) -> (API): /magic/login
(API) -> (Database): Creates user

@User {
  markup: "User initiates login via UI"
}
```

## Development Commands

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Next Steps

- [ ] DSL import functionality
- [ ] Auto-layout algorithms (dagre)
- [ ] Command palette
- [ ] Multi-user collaboration
- [ ] Plugin system