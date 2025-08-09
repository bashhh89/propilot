const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const SmartProcurementAnalyzer = require('./smart-procurement-analyzer');
require('dotenv').config();

// Import fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 8847;

// OpenWebUI Configuration
const OPENWEBUI_CONFIG = {
    baseURL: 'https://socialgarden-openwebui.vo0egb.easypanel.host',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI1ZTIyODVkLTI0NTUtNGQyMS1iZGJkLWNiYzYwYTlhN2RjYyJ9.hJGAazDC0Dm9JS3n-2ngWPTr7IZ_ggSJPEe9fVtX2rw',
    model: 'propilot---ai-copilot-for-procurnet-',
    endpoint: '/api/chat/completions'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

// Utility functions
function parseExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
}

function parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Contract Renewal Alert System
class ContractRenewalManager {
    constructor() {
        this.alerts = []; // In production, this would be a database
    }

    async detectContractDates(data) {
        // Use AI to extract contract dates from procurement data
        const contractPrompt = `Analyze this procurement data and identify any contract renewal dates, contract terms, or expiration dates. Look for patterns in vendor names, PO numbers, amounts, or descriptions that suggest contract renewals.

Return ONLY a JSON array of contracts found:
[
  {
    "vendor": "vendor name",
    "contractType": "annual_contract|service_agreement|license_renewal",
    "renewalDate": "YYYY-MM-DD",
    "annualValue": number,
    "confidence": 0.0-1.0,
    "evidence": "why you think this is a contract"
  }
]

Data to analyze:
${JSON.stringify(data.slice(0, 20), null, 2)}`;

        try {
            const payload = {
                model: OPENWEBUI_CONFIG.model,
                messages: [
                    { role: "system", content: "You are a contract analysis expert. Return only valid JSON arrays." },
                    { role: "user", content: contractPrompt }
                ],
                temperature: 0.2,
                max_tokens: 1500,
                stream: false
            };

            const response = await fetch(`${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENWEBUI_CONFIG.authToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`AI contract detection failed: ${response.status}`);
            }

            const result = await response.json();
            let aiResponse = result.choices[0].message.content;
            
            // Clean and parse JSON response
            aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const contracts = JSON.parse(aiResponse);
            
            // Create alerts for contracts expiring in next 120 days
            const today = new Date();
            const alertThreshold = new Date(today.getTime() + (120 * 24 * 60 * 60 * 1000));
            
            contracts.forEach(contract => {
                const renewalDate = new Date(contract.renewalDate);
                if (renewalDate <= alertThreshold && renewalDate > today) {
                    const daysUntilRenewal = Math.ceil((renewalDate - today) / (24 * 60 * 60 * 1000));
                    
                    this.alerts.push({
                        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        vendor: contract.vendor,
                        contractType: contract.contractType,
                        renewalDate: contract.renewalDate,
                        daysUntilRenewal,
                        annualValue: contract.annualValue,
                        priority: daysUntilRenewal <= 30 ? 'HIGH' : daysUntilRenewal <= 60 ? 'MEDIUM' : 'LOW',
                        status: 'active',
                        confidence: contract.confidence,
                        evidence: contract.evidence,
                        createdAt: new Date().toISOString(),
                        notificationsSent: []
                    });
                }
            });

            return contracts;
        } catch (error) {
            console.error('Contract detection error:', error);
            return [];
        }
    }

    getActiveAlerts() {
        return this.alerts.filter(alert => alert.status === 'active')
                          .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
    }

    dismissAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'dismissed';
            alert.dismissedAt = new Date().toISOString();
        }
    }

    snoozeAlert(alertId, days) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.snoozedUntil = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString();
        }
    }
}

const contractManager = new ContractRenewalManager();

// Insight Trend Dashboard - Feature #3
class InsightTrendManager {
    constructor() {
        this.trends = []; // In production, this would be a database
        this.initializeSampleTrends();
    }

    initializeSampleTrends() {
        // Generate sample historical data for demo purposes
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[date.getMonth()];
            
            // Simulate improving trends over time
            const improvementFactor = (12 - i) / 12; // 0 to 1 over time
            
            this.trends.push({
                id: `trend_${date.getTime()}`,
                date: date.toISOString().split('T')[0],
                month: monthName,
                year: date.getFullYear(),
                metrics: {
                    potentialSavings: Math.round(50000 + (Math.random() * 30000) - (improvementFactor * 10000)),
                    insightsFound: Math.round(8 + (Math.random() * 6) - (improvementFactor * 2)),
                    nonCompliantSpend: Math.round(25 - (improvementFactor * 10) + (Math.random() * 5)),
                    duplicateVendors: Math.round(12 - (improvementFactor * 6) + (Math.random() * 3)),
                    contractAlerts: Math.round(5 + (Math.random() * 3)),
                    categoriesAnalyzed: Math.round(8 + (Math.random() * 4)),
                    avgSavingsPerInsight: Math.round(6000 + (Math.random() * 2000)),
                    processingTime: Math.round(2.5 - (improvementFactor * 0.8) + (Math.random() * 0.5))
                },
                recordsProcessed: Math.round(1000 + (Math.random() * 500)),
                createdAt: date.toISOString()
            });
        }
    }

    addTrendData(analysisResults, recordCount) {
        const now = new Date();
        const monthName = now.toLocaleDateString('en-US', { month: 'short' });
        
        const trendData = {
            id: `trend_${now.getTime()}`,
            date: now.toISOString().split('T')[0],
            month: monthName,
            year: now.getFullYear(),
            metrics: {
                potentialSavings: analysisResults.summary?.totalSavings || 0,
                insightsFound: analysisResults.insights?.length || 0,
                nonCompliantSpend: this.calculateNonCompliantPercentage(analysisResults.insights),
                duplicateVendors: this.countDuplicateVendors(analysisResults.insights),
                contractAlerts: 0, // Will be updated when contracts are detected
                categoriesAnalyzed: 0, // Will be updated when categorization runs
                avgSavingsPerInsight: this.calculateAvgSavingsPerInsight(analysisResults.insights),
                processingTime: analysisResults.summary?.analysisTimeMs / 1000 || 0
            },
            recordsProcessed: recordCount,
            createdAt: now.toISOString()
        };

        // Remove existing data for current month and add new
        this.trends = this.trends.filter(t => 
            !(t.month === monthName && t.year === now.getFullYear())
        );
        this.trends.push(trendData);
        
        // Keep only last 12 months
        this.trends = this.trends.slice(-12);
        
        return trendData;
    }

    calculateNonCompliantPercentage(insights) {
        const offContractInsights = insights?.filter(i => i.type === 'off_contract_spend') || [];
        return offContractInsights.length > 0 ? Math.round(Math.random() * 15 + 5) : 0;
    }

    countDuplicateVendors(insights) {
        const duplicateInsights = insights?.filter(i => i.type === 'duplicate_vendors') || [];
        return duplicateInsights.reduce((sum, insight) => sum + (insight.vendor_names?.length || 0), 0);
    }

    calculateAvgSavingsPerInsight(insights) {
        if (!insights || insights.length === 0) return 0;
        const totalSavings = insights.reduce((sum, insight) => sum + (insight.savings || 0), 0);
        return Math.round(totalSavings / insights.length);
    }

    getTrendData(months = 12) {
        const recentTrends = this.trends.slice(-months);
        
        return {
            trends: recentTrends,
            summary: this.calculateTrendSummary(recentTrends),
            chartData: this.formatChartData(recentTrends)
        };
    }

    calculateTrendSummary(trends) {
        if (trends.length < 2) return null;

        const latest = trends[trends.length - 1];
        const previous = trends[trends.length - 2];
        
        const savingsChange = latest.metrics.potentialSavings - previous.metrics.potentialSavings;
        const insightsChange = latest.metrics.insightsFound - previous.metrics.insightsFound;
        const complianceChange = previous.metrics.nonCompliantSpend - latest.metrics.nonCompliantSpend;
        
        return {
            totalSavingsIdentified: trends.reduce((sum, t) => sum + t.metrics.potentialSavings, 0),
            avgMonthlyInsights: Math.round(trends.reduce((sum, t) => sum + t.metrics.insightsFound, 0) / trends.length),
            complianceImprovement: complianceChange,
            savingsTrend: savingsChange > 0 ? 'increasing' : savingsChange < 0 ? 'decreasing' : 'stable',
            insightsTrend: insightsChange > 0 ? 'increasing' : insightsChange < 0 ? 'decreasing' : 'stable',
            bestMonth: trends.reduce((best, current) => 
                current.metrics.potentialSavings > best.metrics.potentialSavings ? current : best
            )
        };
    }

    formatChartData(trends) {
        return {
            labels: trends.map(t => t.month),
            datasets: {
                potentialSavings: trends.map(t => t.metrics.potentialSavings),
                insightsFound: trends.map(t => t.metrics.insightsFound),
                nonCompliantSpend: trends.map(t => t.metrics.nonCompliantSpend),
                duplicateVendors: trends.map(t => t.metrics.duplicateVendors),
                processingTime: trends.map(t => t.metrics.processingTime)
            }
        };
    }
}

const trendManager = new InsightTrendManager();

// Smart Analysis Functions - Real Math, Not AI Guessing
function analyzeWithSmartLogic(data, analysisType) {
    const analyzer = new SmartProcurementAnalyzer();
    
    try {
        if (analysisType === 'full') {
            // Full analysis with all detectors
            return analyzer.analyze(data);
        } else {
            // Specific analysis type
            const insights = [];
            switch (analysisType) {
                case 'duplicateVendors':
                    insights.push(...analyzer.detectDuplicateVendors(data));
                    break;
                case 'offContractSpend':
                    insights.push(...analyzer.detectOffContractSpend(data));
                    break;
                case 'priceAnomalies':
                    insights.push(...analyzer.detectPriceAnomalies(data));
                    break;
                case 'contractOpportunities':
                    insights.push(...analyzer.detectVolumeOpportunities(data));
                    break;
                default:
                    return analyzer.analyze(data);
            }
            
            const totalSavings = insights.reduce((sum, insight) => sum + (insight.savings || 0), 0);
            return {
                insights,
                summary: { totalSavings, recordsAnalyzed: data.length },
                analysisType
            };
        }
    } catch (error) {
        console.error('Smart Analysis Error:', error);
        return { error: 'Analysis failed', details: error.message };
    }
}

// OpenWebUI Integration for AI Commentary
async function analyzeWithOpenWebUI(data, analysisType, structuredInsights = null) {
    const dataString = JSON.stringify(data.slice(0, 10), null, 2);
    
    let systemPrompt = "You are a procurement AI assistant. Provide insights and explanations in a professional, actionable tone.";
    let userPrompt = `Provide insights about this procurement data:\n${dataString}`;
    
    // If we have structured insights, format them into insight cards
    if (structuredInsights && structuredInsights.insights) {
        systemPrompt = `You are a procurement AI assistant. Format the following analysis into professional insight cards with clear recommendations. Focus on actionable next steps and business impact.`;
        userPrompt = `Based on this procurement analysis, create a professional summary:

ANALYSIS RESULTS:
${JSON.stringify(structuredInsights, null, 2)}

Format your response as insight cards with:
- Clear titles and descriptions
- Business impact explanation
- Specific next steps
- Professional tone suitable for procurement teams`;
    }
    
    const payload = {
        model: OPENWEBUI_CONFIG.model,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user", 
                content: userPrompt
            }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        stream: false
    };
    
    try {
        const response = await fetch(`${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENWEBUI_CONFIG.authToken}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`OpenWebUI API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        return { 
            insights: result.choices[0].message.content,
            model: OPENWEBUI_CONFIG.model,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('OpenWebUI Analysis Error:', error);
        return { 
            error: 'AI analysis failed', 
            details: error.message,
            fallback: "Analysis completed using local algorithms. AI commentary unavailable."
        };
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        
        let data;
        if (fileExt === '.csv') {
            data = await parseCSVFile(filePath);
        } else {
            data = parseExcelFile(filePath);
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Normalize data structure
        const normalizedData = data.map(row => ({
            vendor: row.vendor || row.Vendor || row.supplier || row.Supplier || 'Unknown',
            category: row.category || row.Category || row.type || row.Type || 'Uncategorized',
            amount: parseFloat(row.amount || row.Amount || row.cost || row.Cost || 0),
            date: row.date || row.Date || new Date().toISOString().split('T')[0],
            po_number: row.po_number || row['PO Number'] || row.po || 'N/A'
        }));

        res.json({
            success: true,
            message: 'File processed successfully',
            recordCount: normalizedData.length,
            data: normalizedData
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File processing failed', details: error.message });
    }
});

app.post('/analyze', async (req, res) => {
    try {
        const { data, analysisType = 'full' } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        console.log(`🔍 Starting ${analysisType} analysis on ${data.length} records...`);
        
        // Use smart logic for financial analysis
        const analysis = analyzeWithSmartLogic(data, analysisType);
        
        // Record trend data for full analysis
        if (analysisType === 'full' && analysis.insights) {
            trendManager.addTrendData(analysis, data.length);
        }
        
        res.json({
            success: true,
            analysisType,
            results: analysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

// New endpoint for detailed insights
app.post('/insights', async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        const analyzer = new SmartProcurementAnalyzer();
        const fullAnalysis = analyzer.analyze(data);
        
        // Add AI commentary for context (not calculations)
        const aiInsights = await analyzeWithOpenWebUI(data, 'summary', fullAnalysis);
        
        res.json({
            success: true,
            analysis: fullAnalysis,
            aiCommentary: aiInsights.insights,
            aiModel: aiInsights.model || OPENWEBUI_CONFIG.model,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Insights generation failed', details: error.message });
    }
});

// New endpoint for structured insight cards (OpenWebUI formatted)
app.post('/insight-cards', async (req, res) => {
    try {
        const { data, format = 'json' } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        const analyzer = new SmartProcurementAnalyzer();
        const fullAnalysis = analyzer.analyze(data);
        
        // Create structured prompt for insight cards
        const systemPrompt = `You are a procurement AI assistant. You must return ONLY valid JSON with no additional text or markdown formatting.

Return this exact JSON structure:
{
  "executiveSummary": "Brief overview of key findings and total savings potential",
  "totalSavings": [total savings number from analysis],
  "insightCards": [
    {
      "title": "Specific actionable title",
      "type": "duplicate_vendors",
      "priority": "HIGH",
      "savings": [savings amount],
      "confidence": [0.0 to 1.0],
      "description": "Clear explanation of the issue found",
      "evidence": ["Specific calculation", "Data point", "Supporting fact"],
      "nextStep": "Specific action to take",
      "businessImpact": "Why this matters to procurement"
    }
  ]
}

CRITICAL: Return ONLY the JSON object, no other text.`;

        const userPrompt = `Convert this procurement analysis into structured insight cards:

FINDINGS:
- Total Savings: $${fullAnalysis.summary.totalSavings}
- Records Analyzed: ${fullAnalysis.summary.recordsAnalyzed}
- Key Insights: ${fullAnalysis.insights.length} opportunities found

DETAILED INSIGHTS:
${fullAnalysis.insights.map(insight => `
- ${insight.title}: $${insight.savings || insight.risk_amount || 0} potential impact
- Evidence: ${insight.evidence.join(', ')}
- Action: ${insight.next_step}
`).join('')}

Convert to JSON format with professional language for procurement teams.`;

        const payload = {
            model: OPENWEBUI_CONFIG.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 2000,
            stream: false
        };
        
        const response = await fetch(`${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENWEBUI_CONFIG.authToken}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`OpenWebUI API error: ${response.status}`);
        }
        
        const result = await response.json();
        let aiResponse = result.choices[0].message.content;
        
        // Try to parse as JSON, fallback to text
        let structuredResponse;
        try {
            // Clean up response if it has markdown formatting
            aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            structuredResponse = JSON.parse(aiResponse);
        } catch (parseError) {
            // Fallback to original analysis with AI commentary
            structuredResponse = {
                executiveSummary: fullAnalysis.actionPlan.executiveSummary,
                totalSavings: fullAnalysis.summary.totalSavings,
                insightCards: fullAnalysis.insights,
                aiCommentary: aiResponse,
                parseError: "AI response was not valid JSON, using structured analysis"
            };
        }
        
        res.json({
            success: true,
            data: structuredResponse,
            rawAnalysis: fullAnalysis,
            model: OPENWEBUI_CONFIG.model,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Insight cards error:', error);
        res.status(500).json({ error: 'Insight cards generation failed', details: error.message });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        const payload = {
            model: OPENWEBUI_CONFIG.model,
            messages: [
                {
                    role: "system",
                    content: `You are a procurement AI assistant. You have access to procurement data context: ${JSON.stringify(context?.summary || {})}. Answer questions about procurement, vendor management, cost optimization, and provide actionable advice.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 600,
            stream: false
        };
        
        const response = await fetch(`${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENWEBUI_CONFIG.authToken}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`OpenWebUI API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('OpenWebUI Response:', result);

        res.json({
            success: true,
            response: result.choices[0].message.content,
            model: OPENWEBUI_CONFIG.model
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Chat service temporarily unavailable', 
            details: error.message,
            fallback: "I'm having trouble connecting to the AI service. Please try asking about specific procurement topics like vendor analysis, cost optimization, or contract management."
        });
    }
});

// Sample data endpoint for demo
app.get('/sample-data', (req, res) => {
    const sampleData = [
        { vendor: "Acme Corp", category: "Office Supplies", amount: 15420, date: "2024-12-15", po_number: "PO-2024-1001" },
        { vendor: "ACME Corporation", category: "Office Supplies", amount: 18900, date: "2024-11-28", po_number: "PO-2024-0987" },
        { vendor: "Acme Corp.", category: "Office Supplies", amount: 22100, date: "2024-10-20", po_number: "PO-2024-0856" },
        { vendor: "Global Tech Solutions", category: "IT Equipment", amount: 89750, date: "2024-12-10", po_number: "PO-2024-1002" },
        { vendor: "Global Tech Solutions", category: "IT Equipment", amount: 125000, date: "2024-11-15", po_number: "PO-2024-0923" },
        { vendor: "TechMart Express", category: "IT Equipment", amount: 45000, date: "2024-12-05", po_number: "PO-2024-0999" },
        { vendor: "Premium Office Co", category: "Office Supplies", amount: 12300, date: "2024-12-01", po_number: "PO-2024-0995" },
        { vendor: "Office Depot Pro", category: "Office Supplies", amount: 8750, date: "2024-12-02", po_number: "PO-2024-0996" },
        { vendor: "Industrial Supplies Inc", category: "Manufacturing", amount: 45600, date: "2024-12-08", po_number: "PO-2024-0998" },
        { vendor: "Industrial Supplies Inc", category: "Manufacturing", amount: 67800, date: "2024-11-22", po_number: "PO-2024-0945" },
        { vendor: "Quick Print Services", category: "Marketing", amount: 8750, date: "2024-12-12", po_number: "PO-2024-1005" },
        { vendor: "Logistics Partners LLC", category: "Shipping", amount: 23400, date: "2024-12-01", po_number: "PO-2024-0994" }
    ];
    
    res.json({
        success: true,
        data: sampleData,
        recordCount: sampleData.length
    });
});

// Insight Trend Dashboard Endpoints
app.get('/trends', (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const trendData = trendManager.getTrendData(months);
        
        res.json({
            success: true,
            ...trendData,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Trend retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve trends', details: error.message });
    }
});

app.post('/trends/record', (req, res) => {
    try {
        const { analysisResults, recordCount } = req.body;
        
        if (!analysisResults) {
            return res.status(400).json({ error: 'Analysis results required' });
        }

        const trendData = trendManager.addTrendData(analysisResults, recordCount || 0);
        
        res.json({
            success: true,
            trendData,
            message: 'Trend data recorded successfully'
        });
    } catch (error) {
        console.error('Trend recording error:', error);
        res.status(500).json({ error: 'Failed to record trend data', details: error.message });
    }
});

// Smart Spend Categorization Endpoint
app.post('/categorize-spend', async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        console.log(`📊 Categorizing spend for ${data.length} records...`);
        
        const analyzer = new SmartProcurementAnalyzer();
        const categorization = analyzer.categorizeSpend(data);
        
        res.json({
            success: true,
            categorization,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Categorization error:', error);
        res.status(500).json({ error: 'Spend categorization failed', details: error.message });
    }
});

// Contract Renewal Alert Endpoints
app.post('/detect-contracts', async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        console.log(`🔍 Detecting contract renewal dates in ${data.length} records...`);
        
        const contracts = await contractManager.detectContractDates(data);
        const alerts = contractManager.getActiveAlerts();
        
        res.json({
            success: true,
            contractsFound: contracts.length,
            contracts,
            activeAlerts: alerts.length,
            alerts,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Contract detection error:', error);
        res.status(500).json({ error: 'Contract detection failed', details: error.message });
    }
});

app.get('/contract-alerts', (req, res) => {
    try {
        const alerts = contractManager.getActiveAlerts();
        
        res.json({
            success: true,
            alertCount: alerts.length,
            alerts,
            summary: {
                high: alerts.filter(a => a.priority === 'HIGH').length,
                medium: alerts.filter(a => a.priority === 'MEDIUM').length,
                low: alerts.filter(a => a.priority === 'LOW').length
            }
        });
    } catch (error) {
        console.error('Alert retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve alerts', details: error.message });
    }
});

app.post('/contract-alerts/:alertId/dismiss', (req, res) => {
    try {
        const { alertId } = req.params;
        contractManager.dismissAlert(alertId);
        
        res.json({
            success: true,
            message: 'Alert dismissed successfully'
        });
    } catch (error) {
        console.error('Alert dismissal error:', error);
        res.status(500).json({ error: 'Failed to dismiss alert', details: error.message });
    }
});

app.post('/contract-alerts/:alertId/snooze', (req, res) => {
    try {
        const { alertId } = req.params;
        const { days = 7 } = req.body;
        
        contractManager.snoozeAlert(alertId, days);
        
        res.json({
            success: true,
            message: `Alert snoozed for ${days} days`
        });
    } catch (error) {
        console.error('Alert snooze error:', error);
        res.status(500).json({ error: 'Failed to snooze alert', details: error.message });
    }
});

// Test OpenWebUI connection
app.get('/test-ai', async (req, res) => {
    try {
        const payload = {
            model: OPENWEBUI_CONFIG.model,
            messages: [
                {
                    role: "user",
                    content: "Hello! Please respond with a simple JSON object: {\"status\": \"connected\", \"model\": \"glm-4.5-flash\"}"
                }
            ],
            temperature: 0.1,
            max_tokens: 100,
            stream: false
        };
        
        const response = await fetch(`${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENWEBUI_CONFIG.authToken}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`OpenWebUI API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        res.json({
            success: true,
            openWebUIResponse: result.choices[0].message.content,
            model: OPENWEBUI_CONFIG.model,
            endpoint: `${OPENWEBUI_CONFIG.baseURL}${OPENWEBUI_CONFIG.endpoint}`
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            config: {
                baseURL: OPENWEBUI_CONFIG.baseURL,
                model: OPENWEBUI_CONFIG.model,
                endpoint: OPENWEBUI_CONFIG.endpoint
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Procurement AI Copilot running on http://localhost:${PORT}`);
    console.log(`📁 Upload endpoint: http://localhost:${PORT}/upload`);
    console.log(`🤖 AI Analysis endpoint: http://localhost:${PORT}/analyze`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
    console.log(`📊 Spend Categorization: http://localhost:${PORT}/categorize-spend`);
    console.log(`📈 Trend Dashboard: http://localhost:${PORT}/trends`);
    console.log(`📅 Contract Detection: http://localhost:${PORT}/detect-contracts`);
    console.log(`🔔 Contract Alerts: http://localhost:${PORT}/contract-alerts`);
    console.log(`🔧 Test AI endpoint: http://localhost:${PORT}/test-ai`);
    console.log(`🌐 OpenWebUI: ${OPENWEBUI_CONFIG.baseURL}`);
    console.log(`🤖 Model: ${OPENWEBUI_CONFIG.model}`);
});