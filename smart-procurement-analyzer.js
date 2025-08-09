// Smart Procurement Analyzer - Real Math, Not AI Guessing
class SmartProcurementAnalyzer {
    constructor() {
        // Industry-proven benchmarks from procurement research
        this.benchmarks = {
            duplicateVendorSavings: 0.08,      // 8% savings from vendor consolidation
            offContractPenalty: 0.12,          // 12% higher costs when buying off-contract
            priceVarianceThreshold: 0.25,      // 25% price variance = anomaly
            volumeDiscountThreshold: 50000,    // $50K+ spend = volume discount opportunity
            tailSpendThreshold: 0.05,          // Bottom 5% of spend = tail spend
            maverick_buying_penalty: 0.15      // 15% higher costs from maverick buying
        };
    }

    // Main analysis function
    analyze(data) {
        console.log(`🔍 Analyzing ${data.length} procurement records...`);
        
        const insights = [];
        const startTime = Date.now();

        // 1. Data quality check first
        const qualityIssues = this.checkDataQuality(data);
        
        // 2. Run specific detectors with real math
        insights.push(...this.detectDuplicateVendors(data));
        insights.push(...this.detectOffContractSpend(data));
        insights.push(...this.detectPriceAnomalies(data));
        insights.push(...this.detectVolumeOpportunities(data));
        insights.push(...this.detectTailSpend(data));
        
        // 3. Calculate total impact
        const totalSavings = insights.reduce((sum, insight) => sum + (insight.savings || 0), 0);
        const totalRisk = insights.reduce((sum, insight) => sum + (insight.risk_amount || 0), 0);
        
        const analysisTime = Date.now() - startTime;
        
        return {
            insights: insights.sort((a, b) => (b.savings || 0) - (a.savings || 0)), // Sort by savings
            summary: {
                totalSavings,
                totalRisk,
                recordsAnalyzed: data.length,
                analysisTimeMs: analysisTime,
                confidence: this.calculateOverallConfidence(insights)
            },
            dataQuality: qualityIssues,
            actionPlan: this.generateActionPlan(insights)
        };
    }

    // Detect duplicate vendors with fuzzy matching
    detectDuplicateVendors(data) {
        const insights = [];
        const vendorGroups = {};
        
        // Group vendors by normalized name
        data.forEach(record => {
            const normalizedVendor = this.normalizeVendorName(record.vendor);
            if (!vendorGroups[normalizedVendor]) {
                vendorGroups[normalizedVendor] = [];
            }
            vendorGroups[normalizedVendor].push(record);
        });

        // Find groups with multiple original names (duplicates)
        Object.entries(vendorGroups).forEach(([normalized, records]) => {
            const uniqueNames = [...new Set(records.map(r => r.vendor))];
            
            if (uniqueNames.length > 1) {
                const totalSpend = records.reduce((sum, r) => sum + r.amount, 0);
                const savings = totalSpend * this.benchmarks.duplicateVendorSavings;
                
                insights.push({
                    type: 'duplicate_vendors',
                    title: `Duplicate Vendor: ${uniqueNames[0]}`,
                    description: `Found ${uniqueNames.length} variations of the same vendor`,
                    vendor_names: uniqueNames,
                    total_spend: totalSpend,
                    savings: savings,
                    confidence: this.calculateDuplicateConfidence(uniqueNames),
                    evidence: [
                        `${uniqueNames.length} name variations: ${uniqueNames.join(', ')}`,
                        `Total spend: $${totalSpend.toLocaleString()}`,
                        `Potential savings: $${savings.toLocaleString()} (${(this.benchmarks.duplicateVendorSavings * 100)}% consolidation rate)`
                    ],
                    next_step: `Consolidate to single vendor master record`,
                    priority: savings > 10000 ? 'HIGH' : 'MEDIUM',
                    records: records.length
                });
            }
        });

        return insights;
    }

    // Detect off-contract spending
    detectOffContractSpend(data) {
        const insights = [];
        
        // Identify preferred vendors (top 20% by spend volume)
        const vendorSpend = this.groupByVendor(data);
        const totalSpend = vendorSpend.reduce((sum, v) => sum + v.spend, 0);
        const spendThreshold = totalSpend * 0.8; // Top 20% vendors handle 80% of spend
        
        let cumulativeSpend = 0;
        const preferredVendors = [];
        
        vendorSpend.sort((a, b) => b.spend - a.spend).forEach(vendor => {
            if (cumulativeSpend < spendThreshold) {
                preferredVendors.push(vendor.vendor);
                cumulativeSpend += vendor.spend;
            }
        });

        // Find off-contract spend
        const offContractRecords = data.filter(record => 
            !preferredVendors.includes(record.vendor)
        );

        if (offContractRecords.length > 0) {
            const offContractSpend = offContractRecords.reduce((sum, r) => sum + r.amount, 0);
            const penalty = offContractSpend * this.benchmarks.offContractPenalty;
            
            insights.push({
                type: 'off_contract_spend',
                title: 'Off-Contract Spending Detected',
                description: `${offContractRecords.length} transactions outside preferred vendor network`,
                off_contract_spend: offContractSpend,
                risk_amount: penalty,
                confidence: 0.85,
                evidence: [
                    `${offContractRecords.length} off-contract transactions`,
                    `$${offContractSpend.toLocaleString()} spent outside preferred vendors`,
                    `Estimated ${(this.benchmarks.offContractPenalty * 100)}% cost premium = $${penalty.toLocaleString()}`
                ],
                next_step: 'Review vendor selection criteria and contract coverage',
                priority: penalty > 15000 ? 'HIGH' : 'MEDIUM',
                affected_vendors: [...new Set(offContractRecords.map(r => r.vendor))]
            });
        }

        return insights;
    }

    // Detect price anomalies within categories
    detectPriceAnomalies(data) {
        const insights = [];
        const categoryGroups = {};
        
        // Group by category
        data.forEach(record => {
            if (!categoryGroups[record.category]) {
                categoryGroups[record.category] = [];
            }
            categoryGroups[record.category].push(record);
        });

        Object.entries(categoryGroups).forEach(([category, records]) => {
            if (records.length < 3) return; // Need at least 3 records for comparison
            
            const amounts = records.map(r => r.amount).sort((a, b) => a - b);
            const median = amounts[Math.floor(amounts.length / 2)];
            const q1 = amounts[Math.floor(amounts.length * 0.25)];
            const q3 = amounts[Math.floor(amounts.length * 0.75)];
            const iqr = q3 - q1;
            
            // Find outliers (beyond 1.5 * IQR)
            const outliers = records.filter(record => {
                const amount = record.amount;
                return amount > q3 + (1.5 * iqr) || amount < q1 - (1.5 * iqr);
            });

            if (outliers.length > 0) {
                const outlierSpend = outliers.reduce((sum, r) => sum + r.amount, 0);
                const normalizedSpend = outliers.length * median;
                const variance = outlierSpend - normalizedSpend;
                
                if (variance > 0) { // Only flag if overspending
                    insights.push({
                        type: 'price_anomaly',
                        title: `Price Anomaly in ${category}`,
                        description: `${outliers.length} transactions significantly above market rate`,
                        category: category,
                        outlier_count: outliers.length,
                        excess_spend: variance,
                        median_price: median,
                        confidence: 0.78,
                        evidence: [
                            `${outliers.length} outlier transactions in ${category}`,
                            `Median price: $${median.toLocaleString()}`,
                            `Excess spend: $${variance.toLocaleString()}`
                        ],
                        next_step: 'Review pricing with these vendors and negotiate better rates',
                        priority: variance > 5000 ? 'HIGH' : 'MEDIUM',
                        outlier_vendors: [...new Set(outliers.map(r => r.vendor))]
                    });
                }
            }
        });

        return insights;
    }

    // Detect volume discount opportunities
    detectVolumeOpportunities(data) {
        const insights = [];
        const vendorSpend = this.groupByVendor(data);
        
        vendorSpend.forEach(vendor => {
            if (vendor.spend > this.benchmarks.volumeDiscountThreshold) {
                const potentialSavings = vendor.spend * 0.05; // 5% volume discount
                
                insights.push({
                    type: 'volume_opportunity',
                    title: `Volume Discount Opportunity: ${vendor.vendor}`,
                    description: `High spend volume qualifies for negotiated discounts`,
                    vendor: vendor.vendor,
                    annual_spend: vendor.spend,
                    transaction_count: vendor.count,
                    savings: potentialSavings,
                    confidence: 0.72,
                    evidence: [
                        `Annual spend: $${vendor.spend.toLocaleString()}`,
                        `${vendor.count} transactions`,
                        `Potential 5% volume discount = $${potentialSavings.toLocaleString()}`
                    ],
                    next_step: 'Negotiate volume-based pricing with this vendor',
                    priority: potentialSavings > 8000 ? 'HIGH' : 'MEDIUM'
                });
            }
        });

        return insights;
    }

    // Detect tail spend (many small vendors)
    detectTailSpend(data) {
        const insights = [];
        const vendorSpend = this.groupByVendor(data);
        const totalSpend = vendorSpend.reduce((sum, v) => sum + v.spend, 0);
        
        // Find vendors in bottom 5% of spend but with multiple transactions
        const tailVendors = vendorSpend.filter(vendor => 
            vendor.spend < totalSpend * this.benchmarks.tailSpendThreshold && 
            vendor.count > 2
        );

        if (tailVendors.length > 0) {
            const tailSpend = tailVendors.reduce((sum, v) => sum + v.spend, 0);
            const consolidationSavings = tailSpend * 0.12; // 12% savings from consolidation
            
            insights.push({
                type: 'tail_spend',
                title: 'Tail Spend Consolidation Opportunity',
                description: `${tailVendors.length} low-volume vendors creating administrative overhead`,
                tail_vendor_count: tailVendors.length,
                tail_spend: tailSpend,
                savings: consolidationSavings,
                confidence: 0.68,
                evidence: [
                    `${tailVendors.length} vendors with minimal spend`,
                    `Total tail spend: $${tailSpend.toLocaleString()}`,
                    `Consolidation savings: $${consolidationSavings.toLocaleString()}`
                ],
                next_step: 'Consolidate tail spend with preferred vendors',
                priority: consolidationSavings > 3000 ? 'MEDIUM' : 'LOW',
                tail_vendors: tailVendors.map(v => v.vendor)
            });
        }

        return insights;
    }

    // Helper functions
    normalizeVendorName(name) {
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\b(inc|corp|corporation|llc|ltd|limited|co|company)\b/g, '') // Remove legal suffixes
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }

    groupByVendor(data) {
        const groups = {};
        data.forEach(record => {
            if (!groups[record.vendor]) {
                groups[record.vendor] = { vendor: record.vendor, spend: 0, count: 0 };
            }
            groups[record.vendor].spend += record.amount;
            groups[record.vendor].count += 1;
        });
        return Object.values(groups);
    }

    calculateDuplicateConfidence(names) {
        // Higher confidence for more similar names
        const avgLength = names.reduce((sum, name) => sum + name.length, 0) / names.length;
        const similarity = names.reduce((sum, name) => {
            const others = names.filter(n => n !== name);
            const maxSim = Math.max(...others.map(other => this.stringSimilarity(name, other)));
            return sum + maxSim;
        }, 0) / names.length;
        
        return Math.min(0.95, 0.5 + similarity * 0.5);
    }

    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    checkDataQuality(data) {
        const issues = [];
        
        // Check for missing amounts
        const missingAmounts = data.filter(row => !row.amount || row.amount === 0);
        if (missingAmounts.length > 0) {
            issues.push(`${missingAmounts.length} records missing amounts`);
        }
        
        // Check for missing vendors
        const missingVendors = data.filter(row => !row.vendor || row.vendor.trim() === '');
        if (missingVendors.length > 0) {
            issues.push(`${missingVendors.length} records missing vendor names`);
        }
        
        // Check for invalid dates
        const invalidDates = data.filter(row => row.date && isNaN(Date.parse(row.date)));
        if (invalidDates.length > 0) {
            issues.push(`${invalidDates.length} records with invalid dates`);
        }
        
        return issues;
    }

    calculateOverallConfidence(insights) {
        if (insights.length === 0) return 0;
        const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
        return Math.round(avgConfidence * 100) / 100;
    }

    generateActionPlan(insights) {
        const totalSavings = insights.reduce((sum, insight) => sum + (insight.savings || 0), 0);
        
        return {
            executiveSummary: `Analysis identified $${totalSavings.toLocaleString()} in potential savings across ${insights.length} opportunities`,
            priorityActions: insights
                .filter(insight => insight.priority === 'HIGH')
                .map(insight => ({
                    action: insight.next_step,
                    impact: insight.savings || insight.risk_amount || 0,
                    timeline: '30-60 days',
                    owner: 'Procurement Team'
                })),
            quickWins: insights
                .filter(insight => insight.type === 'duplicate_vendors' || insight.type === 'price_anomaly')
                .slice(0, 3),
            csvExportReady: true
        };
    }

    // Smart Spend Categorization - Feature #2
    categorizeSpend(data) {
        const categories = {};
        const categoryMappings = this.getCategoryMappings();
        
        data.forEach(record => {
            // Use existing category or smart categorize
            let category = record.category || 'Uncategorized';
            
            // Smart categorization based on vendor name and amount patterns
            if (category === 'Uncategorized' || category === '') {
                category = this.smartCategorizeItem(record, categoryMappings);
            }
            
            // Normalize category name
            category = this.normalizeCategoryName(category);
            
            if (!categories[category]) {
                categories[category] = {
                    name: category,
                    totalSpend: 0,
                    transactionCount: 0,
                    vendors: new Set(),
                    avgTransactionSize: 0,
                    records: []
                };
            }
            
            categories[category].totalSpend += record.amount;
            categories[category].transactionCount += 1;
            categories[category].vendors.add(record.vendor);
            categories[category].records.push(record);
        });
        
        // Calculate averages and convert sets to arrays
        Object.values(categories).forEach(cat => {
            cat.avgTransactionSize = cat.totalSpend / cat.transactionCount;
            cat.vendors = Array.from(cat.vendors);
            cat.vendorCount = cat.vendors.length;
        });
        
        return this.generateCategoryInsights(categories);
    }

    getCategoryMappings() {
        return {
            'IT Hardware': ['laptop', 'computer', 'server', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'tablet', 'phone', 'hardware', 'tech', 'dell', 'hp', 'lenovo', 'apple', 'microsoft'],
            'Software': ['license', 'subscription', 'software', 'saas', 'cloud', 'adobe', 'microsoft', 'oracle', 'salesforce', 'zoom', 'slack', 'office'],
            'Office Supplies': ['supplies', 'paper', 'pen', 'pencil', 'stapler', 'folder', 'binder', 'office', 'stationery', 'depot', 'staples'],
            'Professional Services': ['consulting', 'legal', 'accounting', 'audit', 'advisory', 'professional', 'services', 'lawyer', 'consultant'],
            'Marketing': ['advertising', 'marketing', 'promotion', 'print', 'design', 'creative', 'media', 'campaign', 'branding'],
            'Travel': ['travel', 'hotel', 'flight', 'airline', 'booking', 'expense', 'trip', 'accommodation'],
            'Facilities': ['rent', 'utilities', 'maintenance', 'cleaning', 'security', 'facility', 'building', 'janitorial'],
            'Manufacturing': ['materials', 'parts', 'components', 'manufacturing', 'production', 'industrial', 'machinery'],
            'Shipping': ['shipping', 'freight', 'logistics', 'delivery', 'transport', 'courier', 'fedex', 'ups', 'dhl'],
            'Telecommunications': ['phone', 'internet', 'telecom', 'communication', 'network', 'verizon', 'att', 'comcast']
        };
    }

    smartCategorizeItem(record, mappings) {
        const searchText = `${record.vendor} ${record.po_number || ''}`.toLowerCase();
        
        for (const [category, keywords] of Object.entries(mappings)) {
            if (keywords.some(keyword => searchText.includes(keyword))) {
                return category;
            }
        }
        
        // Amount-based categorization for uncategorized items
        if (record.amount > 50000) return 'Major Purchases';
        if (record.amount < 500) return 'Small Purchases';
        
        return 'General Procurement';
    }

    normalizeCategoryName(category) {
        // Standardize category names
        const normalized = category.trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Map common variations
        const mappings = {
            'It Equipment': 'IT Hardware',
            'It Hardware': 'IT Hardware',
            'Technology': 'IT Hardware',
            'Office Supply': 'Office Supplies',
            'Supplies': 'Office Supplies',
            'Legal Services': 'Professional Services',
            'Consulting Services': 'Professional Services'
        };
        
        return mappings[normalized] || normalized;
    }

    generateCategoryInsights(categories) {
        const insights = [];
        const totalSpend = Object.values(categories).reduce((sum, cat) => sum + cat.totalSpend, 0);
        
        // Sort categories by spend
        const sortedCategories = Object.values(categories)
            .sort((a, b) => b.totalSpend - a.totalSpend);
        
        // Look for consolidation opportunities within categories
        sortedCategories.forEach(category => {
            if (category.vendorCount > 3 && category.totalSpend > 10000) {
                const consolidationSavings = category.totalSpend * 0.08; // 8% savings from vendor consolidation
                
                insights.push({
                    type: 'category_consolidation',
                    title: `${category.name} Vendor Consolidation`,
                    description: `${category.vendorCount} vendors in ${category.name} category`,
                    category: category.name,
                    vendor_count: category.vendorCount,
                    total_spend: category.totalSpend,
                    savings: consolidationSavings,
                    confidence: 0.75,
                    evidence: [
                        `${category.vendorCount} vendors in ${category.name}`,
                        `Total category spend: ${category.totalSpend.toLocaleString()}`,
                        `Average transaction: ${category.avgTransactionSize.toLocaleString()}`,
                        `Potential 8% consolidation savings: ${consolidationSavings.toLocaleString()}`
                    ],
                    next_step: `Consolidate ${category.name} vendors to 2-3 preferred suppliers`,
                    priority: consolidationSavings > 5000 ? 'HIGH' : 'MEDIUM',
                    vendors: category.vendors
                });
            }
        });
        
        // Identify categories with high transaction volumes but low average amounts
        sortedCategories.forEach(category => {
            if (category.transactionCount > 10 && category.avgTransactionSize < 1000) {
                const adminSavings = category.transactionCount * 25; // $25 admin cost per transaction
                
                insights.push({
                    type: 'transaction_efficiency',
                    title: `${category.name} Transaction Efficiency`,
                    description: `High volume of small transactions increasing admin costs`,
                    category: category.name,
                    transaction_count: category.transactionCount,
                    avg_transaction: category.avgTransactionSize,
                    admin_cost: adminSavings,
                    confidence: 0.68,
                    evidence: [
                        `${category.transactionCount} transactions in ${category.name}`,
                        `Average transaction size: ${category.avgTransactionSize.toLocaleString()}`,
                        `Estimated admin cost: ${adminSavings.toLocaleString()}`
                    ],
                    next_step: `Implement blanket POs or bulk ordering for ${category.name}`,
                    priority: adminSavings > 1000 ? 'MEDIUM' : 'LOW'
                });
            }
        });
        
        return {
            insights,
            categoryBreakdown: sortedCategories.map(cat => ({
                name: cat.name,
                totalSpend: cat.totalSpend,
                percentage: (cat.totalSpend / totalSpend * 100).toFixed(1),
                transactionCount: cat.transactionCount,
                vendorCount: cat.vendorCount,
                avgTransactionSize: cat.avgTransactionSize
            })),
            summary: {
                totalCategories: Object.keys(categories).length,
                topCategory: sortedCategories[0]?.name,
                topCategorySpend: sortedCategories[0]?.totalSpend,
                totalSpend
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartProcurementAnalyzer;
}