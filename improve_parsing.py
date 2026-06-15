with open('app.js', 'r') as f:
    content = f.read()

# Replace the entire parseReceiptText function with improved version
old_parse = '''function parseReceiptText(text) {
    const lines = text.split('\n').filter(l => l.trim());
    let receiptDate = null;
    
    // Extract date from receipt
    const datePatterns = [
        /\d{1,2}\/\d{1,2}\/\d{2,4}/,
        /\d{1,2}-\d{1,2}-\d{2,4}/,
        /\d{4}-\d{1,2}-\d{1,2}/,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
    ];
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) { receiptDate = match[0]; break; }
    }
    
    
    // Look for store name (usually first meaningful line)
    let storeName = '';
    let totalAmount = null;
    let items = [];
    
    // Extract amounts - look for currency patterns
    const amountRegex = /[\$]?\s?(\d+\.?\d{0,2})/g;
    const amounts = [];
    const matches = text.matchAll(amountRegex);
    for (const match of matches) {
        const amount = parseFloat(match[1]);
        if (amount > 0 && amount < 10000) amounts.push(amount);
    }
    
    // Largest amount is likely total
    if (amounts.length > 0) {
        amounts.sort((a, b) => b - a);
        totalAmount = amounts[0];
    }
    
    // Get first few meaningful lines for store name and items
    storeName = lines.slice(0, 2).join(' ').substring(0, 50);
    items = lines.slice(2, 5);
    
    return {
        store: storeName,
        amount: totalAmount,
        items: items,
        date: receiptDate,
        rawText: text
    };
}'''

new_parse = '''function parseReceiptText(text) {
    const lines = text.split('\n').filter(l => l.trim());
    let receiptDate = null;
    let storeName = '';
    let totalAmount = null;
    let items = [];
    
    // Extract date from receipt
    const datePatterns = [
        /\d{1,2}\/\d{1,2}\/\d{2,4}/,
        /\d{1,2}-\d{1,2}-\d{2,4}/,
        /\d{4}-\d{1,2}-\d{1,2}/,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
    ];
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) { receiptDate = match[0]; break; }
    }
    
    // Find store name - look for lines containing common keywords at top
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (line.length > 5 && line.length < 60 && !line.match(/^\d+$/) && !line.match(/\$/) && line.toUpperCase() === line) {
            storeName = line;
            break;
        }
    }
    
    // If not found, use first non-number line
    if (!storeName) {
        for (const line of lines) {
            if (line.length > 5 && !line.match(/^\d/) && line.length < 60) {
                storeName = line.substring(0, 50);
                break;
            }
        }
    }
    
    // Find TOTAL amount - look for lines with "TOTAL" keyword
    let totalMatch = null;
    for (const line of lines) {
        if (line.toUpperCase().includes('TOTAL')) {
            totalMatch = line.match(/\$?\s?(\d+\.\d{2})/);
            if (totalMatch) {
                totalAmount = parseFloat(totalMatch[1]);
                break;
            }
        }
    }
    
    // If no TOTAL found, look for the last significant amount (usually the total)
    if (!totalAmount) {
        const amounts = [];
        let match;
        const amountRegex = /\$?\s?(\d{1,4}\.\d{2})/g;
        while ((match = amountRegex.exec(text)) !== null) {
            const amt = parseFloat(match[1]);
            if (amt > 0.5 && amt < 10000) amounts.push(amt);
        }
        // Get amounts that look like totals (usually XX.XX format with 2 decimals)
        if (amounts.length > 0) {
            // Get the last reasonable amount that looks like a total
            for (let i = amounts.length - 1; i >= 0; i--) {
                if (amounts[i] > 0.5 && amounts[i] < 9999) {
                    totalAmount = amounts[i];
                    break;
                }
            }
        }
    }
    
    // Get item lines (lines that look like product lines with amounts)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('$') && !line.toUpperCase().includes('TOTAL') && 
            !line.toUpperCase().includes('TAX') && !line.toUpperCase().includes('SUB')) {
            items.push(line.substring(0, 60));
            if (items.length >= 3) break;
        }
    }
    
    return {
        store: storeName || 'Receipt',
        amount: totalAmount || 0,
        items: items.length > 0 ? items : lines.slice(2, 4),
        date: receiptDate,
        rawText: text
    };
}'''

content = content.replace(old_parse, new_parse)

with open('app.js', 'w') as f:
    f.write(content)

print("Improved receipt parsing logic")

