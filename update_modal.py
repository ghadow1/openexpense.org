import re

with open('app.js', 'r') as f:
    content = f.read()

# Find and replace the entire showOCRPreviewModal function
start_marker = "function showOCRPreviewModal(parsed, rawText) {"
end_marker = "function closeOCRModal() {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = content[:start_idx + len(start_marker)]
    after = "\n\n" + content[end_idx:]
    
    new_function = '''
    const c = AppState.getColors();
    const modal = document.createElement('div');
    modal.id = 'ocr-preview-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${c.overlay};
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: ${c.surface};
        border: 1px solid ${c.border};
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    // Get date - use today or parsed receipt date
    const today = new Date();
    let defaultDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
    
    if (parsed.date) {
        try {
            const pd = new Date(parsed.date);
            if (!isNaN(pd.getTime())) {
                defaultDate = pd.getFullYear() + '-' + 
                    String(pd.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(pd.getDate()).padStart(2, '0');
            }
        } catch (e) {}
    }
    
    content.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid ${c.border};">
            <i class="ti ti-receipt-2" style="font-size:24px; color:${c.accent};"></i>
            <div>
                <h3 style="color:${c.textStrong}; margin:0; margin-bottom:2px; font-size:16px;">Receipt Extracted</h3>
                <p style="color:${c.text2}; margin:0; font-size:12px;">Review and edit the extracted data</p>
            </div>
        </div>
        
        <div style="margin-bottom:16px;">
            <label style="color:${c.textStrong}; font-size:12px; font-weight:600; display:block; margin-bottom:6px;">Store/Vendor:</label>
            <input type="text" id="ocr-title-input" value="${(parsed.store || '').replace(/"/g, '&quot;')}" 
                style="width:100%; padding:10px; border:1px solid ${c.border}; border-radius:4px; background:${c.inputBg}; color:${c.text}; box-sizing:border-box; font-size:13px;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div>
                <label style="color:${c.textStrong}; font-size:12px; font-weight:600; display:block; margin-bottom:6px;">Amount ($):</label>
                <input type="number" id="ocr-amount-input" value="${parsed.amount || ''}" step="0.01"
                    style="width:100%; padding:10px; border:1px solid ${c.border}; border-radius:4px; background:${c.inputBg}; color:${c.text}; box-sizing:border-box; font-size:13px;">
            </div>
            <div>
                <label style="color:${c.textStrong}; font-size:12px; font-weight:600; display:block; margin-bottom:6px;">Date:</label>
                <input type="date" id="ocr-date-input" value="${defaultDate}"
                    style="width:100%; padding:10px; border:1px solid ${c.border}; border-radius:4px; background:${c.inputBg}; color:${c.text}; box-sizing:border-box; font-size:13px;">
            </div>
        </div>
        
        <div style="margin-bottom:20px;">
            <label style="color:${c.textStrong}; font-size:12px; font-weight:600; display:block; margin-bottom:6px;">Notes:</label>
            <textarea id="ocr-note-input" placeholder="Additional details from receipt"
                style="width:100%; padding:10px; border:1px solid ${c.border}; border-radius:4px; background:${c.inputBg}; color:${c.text}; box-sizing:border-box; font-size:13px; height:80px; resize:vertical; font-family:inherit;">${(parsed.items || []).join(', ')}</textarea>
        </div>
        
        <div style="display:flex; gap:10px; justify-content:flex-end; padding-top:12px; border-top:1px solid ${c.border};">
            <button onclick="closeOCRModal()" style="padding:10px 20px; border:1px solid ${c.border}; background:${c.btnBg}; color:${c.btnText}; border-radius:6px; cursor:pointer; font-size:13px; font-weight:500;">Cancel</button>
            <button onclick="applyOCRData()" style="padding:10px 20px; border:none; background:${c.accent}; color:#fff; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Apply to Expense</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
'''
    
    new_content = before + new_function + after
    
    with open('app.js', 'w') as f:
        f.write(new_content)
    
    print("Updated showOCRPreviewModal function")
else:
    print("ERROR: Could not find function markers")

