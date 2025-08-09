class ProcurementAI {
    constructor() {
        this.currentData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const sampleBtn = document.getElementById('sampleBtn');
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');

        // Upload area interactions
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        uploadBtn.addEventListener('click', () => fileInput.click());
        sampleBtn.addEventListener('click', this.loadSampleData.bind(this));

        // Chat
        chatSend.addEventListener('click', this.sendChatMessage.bind(this));
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async loadSampleData() {
        this.showProcessing('Loading sample data...');
        
        try {
            const response = await fetch('/sample-data');
            const result = await response.json();
            
            if (result.success) {
                this.currentData = result.data;
                this.showDataPreview(result.data);
                await this.runAIAnalysis(result.data);
                this.showResults();
                this.showMessage('Sample data loaded successfully!', 'success');
            } else {
                throw new Error('Failed to load sample data');
            }
        } catch (error) {
            this.showMessage(`Error loading sample data: ${error.message}`, 'error');
        } finally {
            this.hideProcessing();
        }
    }

    async processFile(file) {
        this.showProcessing('Uploading and processing file...');
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentData = result.data;
                this.showDataPreview(result.data);
                this.showMessage(`File processed successfully! ${result.recordCount} records found.`, 'success');
                
                // Run AI analysis
                await this.runAIAnalysis(result.data);
                this.showResults();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            this.showMessage(`Upload error: ${error.message}`, 'error');
        } finally {
            this.hideProcessing();
        }
    }

    async runAIAnalysis(data) {
        this.updateProcessingStatus('Running comprehensive AI analysis...');
        
        try {
            // Use the full analysis endpoint instead of multiple calls
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: data,
                    analysisType: 'full'
                })
            });

            const result = await response.json();
            
            if (result.success && result.results && result.results.insights) {
                // Convert the insights to the expected format
                const formattedInsights = [{
                    type: 'full_analysis',
                    data: result.results
                }];
                
                this.displayInsights(formattedInsights);
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showMessage(`Analysis error: ${error.message}`, 'error');
        }
    }

    displayInsights(insights) {
        const grid = document.getElementById('insightsGrid');
        grid.innerHTML = '';

        // Filter out empty or duplicate insights
        const validInsights = insights.filter(insight => 
            insight.data && 
            (insight.data.insights?.length > 0 || 
             insight.data.duplicates?.length > 0 || 
             insight.data.summary)
        );

        if (validInsights.length === 0) {
            grid.innerHTML = `
                <div class="insight-card">
                    <div class="insight-type savings">No Issues Found</div>
                    <h3 class="insight-title">Clean Data</h3>
                    <p class="insight-description">Your procurement data looks good! No major issues detected.</p>
                    <div class="insight-impact">Well-managed procurement</div>
                </div>
            `;
            return;
        }

        validInsights.forEach(insight => {
            const card = this.createInsightCard(insight);
            grid.appendChild(card);
        });
    }

    createInsightCard(insight) {
        const card = document.createElement('div');
        card.className = 'insight-card';
        
        if (insight.type === 'full_analysis' && insight.data.insights) {
            // Handle full analysis results
            const container = document.createElement('div');
            
            insight.data.insights.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'insight-card';
                
                // Determine card type based on insight type
                let cardType = 'savings';
                if (item.type === 'duplicate_vendors' || item.type === 'off_contract_spend') {
                    cardType = 'risk';
                } else if (item.type === 'price_anomalies' || item.type === 'volume_opportunities') {
                    cardType = 'opportunity';
                }
                
                itemCard.classList.add(cardType);
                
                const savings = item.savings || item.risk_amount || 0;
                const impact = savings > 0 ? `$${savings.toLocaleString()} potential savings` : 'Optimization opportunity';
                
                itemCard.innerHTML = `
                    <div class="insight-type ${cardType}">${cardType}</div>
                    <h3 class="insight-title">${item.title}</h3>
                    <p class="insight-description">${item.description}</p>
                    <div class="insight-impact">${impact}</div>
                `;
                
                container.appendChild(itemCard);
            });
            
            return container;
        } else {
            // Fallback for other formats
            card.classList.add('savings');
            card.innerHTML = `
                <div class="insight-type savings">analysis</div>
                <h3 class="insight-title">Analysis Complete</h3>
                <p class="insight-description">Procurement analysis has been completed successfully.</p>
                <div class="insight-impact">Ready for review</div>
            `;
            return card;
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const messages = document.getElementById('chatMessages');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `<strong>You:</strong> ${message}`;
        messages.appendChild(userMessage);

        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message ai';
        typingIndicator.innerHTML = '<strong>AI Copilot:</strong> <i>Thinking...</i>';
        messages.appendChild(typingIndicator);
        messages.scrollTop = messages.scrollHeight;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    context: {
                        summary: this.currentData ? {
                            recordCount: this.currentData.length,
                            totalSpend: this.currentData.reduce((sum, item) => sum + item.amount, 0)
                        } : null
                    }
                })
            });

            const result = await response.json();
            
            // Remove typing indicator
            messages.removeChild(typingIndicator);

            // Add AI response
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message ai';
            
            if (result.success && result.response) {
                aiMessage.innerHTML = `<strong>AI Copilot:</strong> ${result.response}`;
            } else {
                aiMessage.innerHTML = `<strong>AI Copilot:</strong> I apologize, but I'm having trouble processing your request right now. The error was: ${result.error || 'Unknown error'}`;
            }
            
            messages.appendChild(aiMessage);
            
        } catch (error) {
            // Remove typing indicator
            messages.removeChild(typingIndicator);
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'chat-message ai';
            errorMessage.innerHTML = `<strong>AI Copilot:</strong> Sorry, I'm having trouble connecting to the AI service. Please try again.`;
            messages.appendChild(errorMessage);
        }

        messages.scrollTop = messages.scrollHeight;
    }

    showDataPreview(data) {
        const preview = document.getElementById('dataPreview');
        const sampleData = data.slice(0, 5);
        
        preview.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: #3b82f6;">
                <i class="fas fa-table"></i> Data Preview (${data.length} total records)
            </h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Vendor</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>PO Number</th>
                    </tr>
                </thead>
                <tbody>
                    ${sampleData.map(item => `
                        <tr>
                            <td>${item.vendor}</td>
                            <td>${item.category}</td>
                            <td>$${item.amount.toLocaleString()}</td>
                            <td>${item.date}</td>
                            <td>${item.po_number}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="margin-top: 0.5rem; color: #94a3b8; font-size: 0.875rem;">
                Showing first 5 records. AI analysis covers all ${data.length} records.
            </p>
        `;
    }

    showProcessing(message) {
        document.getElementById('processing').classList.add('active');
        document.getElementById('processingStatus').textContent = message;
    }

    hideProcessing() {
        document.getElementById('processing').classList.remove('active');
    }

    updateProcessingStatus(message) {
        document.getElementById('processingStatus').textContent = message;
    }

    showResults() {
        document.getElementById('results').classList.add('active');
    }

    showMessage(message, type) {
        const messagesDiv = document.getElementById('messages');
        const messageEl = document.createElement('div');
        messageEl.className = type;
        messageEl.textContent = message;
        messagesDiv.appendChild(messageEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ProcurementAI();
});