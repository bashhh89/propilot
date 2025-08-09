# Technology Stack & Build System

## Backend Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18.2)
- **AI Integration**: OpenAI API (v4.20.1) + OpenWebUI integration
- **File Processing**: XLSX (v0.18.5), CSV-Parser (v3.0.0)
- **File Upload**: Multer (v1.4.5-lts.1)
- **Environment**: dotenv (v16.3.1)
- **CORS**: CORS (v2.8.5)

## Frontend Stack
- **Core**: Vanilla JavaScript (ES6+)
- **UI**: Custom CSS with glassmorphism effects
- **Icons**: Font Awesome (v6.4.0)
- **Design**: Responsive, mobile-first approach
- **Theme**: Dark mode with gradient backgrounds

## Development Tools
- **Dev Server**: Nodemon (v3.0.1) for hot reload
- **Package Manager**: npm

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm start
```

### Environment Setup
```bash
# Create .env file with required variables
OPENAI_API_KEY=your-openai-key-here
PORT=3000
```

### Testing Endpoints
```bash
# Test AI connection
curl http://localhost:3000/test-ai

# Upload sample data
curl http://localhost:3000/sample-data

# Test file upload (requires multipart form data)
# Use Postman or frontend interface
```

## Architecture Patterns
- **RESTful API**: Clean endpoint design
- **Modular Components**: Separate analyzer class for business logic
- **Error Handling**: Graceful error recovery with detailed messages
- **File Processing**: Stream-based processing for large files
- **AI Integration**: Hybrid approach combining mathematical analysis with AI commentary

## Key Libraries & Frameworks
- **Express.js**: Web server framework
- **Multer**: File upload middleware
- **XLSX**: Excel file parsing
- **CSV-Parser**: CSV file processing
- **OpenAI**: AI integration for contextual analysis
- **SmartProcurementAnalyzer**: Custom algorithm engine for financial calculations