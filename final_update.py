import re

with open('app.js', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Update parseReceiptText to add date extraction
    if 'function parseReceiptText(text) {' in line:
        new_lines.append(line)
        i += 1
        # Insert date extraction logic right after function start
        new_lines.append('    const lines = text.split(\'\\n\').filter(l => l.trim());\n')
        new_lines.append('    let receiptDate = null;\n')
        new_lines.append('    \n')
        new_lines.append('    // Extract date from receipt\n')
        new_lines.append('    const datePatterns = [\n')
        new_lines.append('        /\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}/,\n')
        new_lines.append('        /\\d{1,2}-\\d{1,2}-\\d{2,4}/,\n')
        new_lines.append('        /\\d{4}-\\d{1,2}-\\d{1,2}/,\n')
        new_lines.append('        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{1,2},?\\s+\\d{4}/i,\n')
        new_lines.append('    ];\n')
        new_lines.append('    for (const pattern of datePatterns) {\n')
        new_lines.append('        const match = text.match(pattern);\n')
        new_lines.append('        if (match) { receiptDate = match[0]; break; }\n')
        new_lines.append('    }\n')
        new_lines.append('    \n')
        # Skip the original declaration lines
        while i < len(lines) and 'const lines = text.split' not in lines[i]:
            i += 1
        i += 1  # skip the line
        continue
    
    # Add date to return object
    if 'return {' in line and 'store: storeName' in lines[i+1] if i+1 < len(lines) else False:
        new_lines.append(line)
        i += 1
        new_lines.append(lines[i])  # store: storeName
        i += 1
        new_lines.append(lines[i])  # amount: totalAmount
        i += 1
        new_lines.append(lines[i])  # items: items
        new_lines.append('        date: receiptDate,\n')
        i += 1
        continue
    
    # Update applyOCRData to handle date
    if 'function applyOCRData() {' in line:
        new_lines.append(line)
        i += 1
        new_lines.append(lines[i])  # const title
        i += 1
        new_lines.append('    const dateStr = document.getElementById(\'ocr-date-input\').value;\n')
        new_lines.append(lines[i])  # const amount
        i += 1
        # Skip to closeOCRModal and add date handling before it
        while i < len(lines) and 'closeOCRModal()' not in lines[i]:
            new_lines.append(lines[i])
            i += 1
        # Add date handling
        new_lines.append('    if (dateStr) {\n')
        new_lines.append('        const [y, m, d] = dateStr.split(\'-\');\n')
        new_lines.append('        AppState.currentDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));\n')
        new_lines.append('        render();\n')
        new_lines.append('    }\n')
        new_lines.append('    \n')
        new_lines.append(lines[i])  # closeOCRModal
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open('app.js', 'w') as f:
    f.writelines(new_lines)

print("Updated app.js with date support")

