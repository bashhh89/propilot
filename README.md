# Procurement AI Copilot - Real Implementation

A fully functional AI-powered procurement analysis tool that processes real spreadsheet data and provides actionable insights using OpenAI's GPT-4.

## 🚀 Features

- **Real File Processing**: Upload CSV/Excel files with actual procurement data
- **AI-Powered Analysis**: Uses OpenAI GPT-4 for intelligent data analysis
- **Multiple Analysis Types**:
  - Duplicate vendor detection
  - Off-contract spend identification
  - Price anomaly detection
  - Contract opportunity analysis
  - Executive summary generation
- **Interactive AI Chat**: Ask questions about your procurement data
- **Professional UI**: Production-ready interface
- **RESTful API**: Clean backend architecture

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **AI Integration**: OpenAI GPT-4 API
- **File Processing**: XLSX, CSV-Parser
- **Frontend**: Vanilla JavaScript (production-ready)
- **Styling**: Modern CSS with glassmorphism effects

## 📦 Installation

1. **Clone and setup**:
```bash
npm install
```

2. **Configure OpenAI API**:
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Update `.env` file:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

3. **Run the application**:
```bash
npm start
```

4. **Access the app**:
   - Open http://localhost:3000
   - Upload your procurement data or use sample data
   - Get AI-powered insights instantly!

## 🎯 API Endpoints

- `POST /upload` - Upload and process procurement files
- `POST /analyze` - Run AI analysis on data
- `POST /chat` - Interactive AI chat about procurement data
- `GET /sample-data` - Load demo data for testing

## 📊 Data Format

Your procurement data should include columns like:
- `vendor` or `Vendor` - Vendor name
- `category` or `Category` - Procurement category
- `amount` or `Amount` - Purchase amount
- `date` or `Date` - Purchase date
- `po_number` or `PO Number` - Purchase order number

## 🔧 Development

For development with auto-reload:
```bash
npm run dev
```

## 💡 Usage Examples

1. **Upload Real Data**: Drop your procurement CSV/Excel file
2. **AI Analysis**: Get insights on vendor consolidation, price anomalies, contract opportunities
3. **Interactive Chat**: Ask "Which vendor offers the best value?" or "How can I reduce IT costs?"
4. **Executive Reports**: Get business-ready summaries with ROI calculations

## 🎯 Job Interview Demo

This is a complete, working implementation that demonstrates:
- ✅ Real file upload and processing
- ✅ OpenAI API integration
- ✅ Professional UI/UX
- ✅ RESTful architecture
- ✅ Error handling
- ✅ Production-ready code

Perfect for showcasing full-stack AI development skills in procurement domain.

## 🚀 Deployment Ready

- Environment configuration
- Error handling
- CORS enabled
- Production-optimized
- Scalable architecture

## 📝 License

MIT License - Feel free to use for your projects!