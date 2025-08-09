# Project Structure & Organization

## Root Directory Layout
```
procurement-ai-copilot/
├── server.js                          # Main Express server entry point
├── smart-procurement-analyzer.js      # Core business logic & algorithms
├── package.json                       # Dependencies & scripts
├── .env                               # Environment variables (API keys)
├── README.md                          # Project documentation
├── TECHNICAL_REQUIREMENTS.md          # Detailed technical specs
└── uploads/                           # Temporary file upload directory
```

## Frontend Files
```
├── index.html                         # Main application entry point
├── smart-procurement-frontend.html    # Alternative frontend implementation
├── procurement-*.html                 # Various demo/prototype pages
├── cross-border-dashboard.html        # Specialized dashboard variant
└── public/                           # Static assets
    ├── app.js                        # Frontend JavaScript
    └── index.html                    # Public-facing entry
```

## Configuration & Settings
```
├── .kiro/                            # Kiro IDE configuration
│   └── steering/                     # AI assistant guidance docs
├── .vscode/                          # VS Code settings
└── node_modules/                     # npm dependencies
```

## File Naming Conventions
- **Server files**: kebab-case (e.g., `smart-procurement-analyzer.js`)
- **HTML files**: kebab-case with descriptive names (e.g., `procurement-ai-demo.html`)
- **Configuration**: Standard names (`.env`, `package.json`)
- **Documentation**: UPPERCASE for important docs (`README.md`, `TECHNICAL_REQUIREMENTS.md`)

## Code Organization Patterns

### Backend Structure
- **server.js**: Express routes, middleware, API endpoints
- **smart-procurement-analyzer.js**: Pure business logic class with mathematical algorithms
- **Separation of concerns**: API layer separate from business logic

### Frontend Structure
- **Vanilla JavaScript**: No framework dependencies for simplicity
- **Inline CSS**: Styles embedded in HTML for self-contained demos
- **Modular functions**: Clear separation between UI and data processing

### API Endpoint Organization
```
POST /upload              # File upload & processing
POST /analyze             # Smart analysis with algorithms
POST /insights            # AI-enhanced insights
POST /insight-cards       # Structured insight formatting
POST /chat                # Interactive AI chat
GET  /sample-data         # Demo data for testing
GET  /test-ai             # AI connection testing
```

## Development Workflow
1. **Main entry**: Start with `server.js` for backend changes
2. **Business logic**: Modify `smart-procurement-analyzer.js` for algorithm updates
3. **Frontend**: Use `index.html` as primary UI, other HTML files for prototypes
4. **Testing**: Use `/sample-data` endpoint for consistent test data
5. **Environment**: Configure `.env` for API keys and settings

## File Dependencies
- **server.js** → depends on `smart-procurement-analyzer.js`
- **HTML files** → standalone, no cross-dependencies
- **All files** → depend on `package.json` dependencies
- **Runtime** → requires `.env` configuration for AI features