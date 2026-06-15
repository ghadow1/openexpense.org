with open('app.js', 'r') as f:
    content = f.read()

# Update applyOCRData to handle date
old_apply = '''function applyOCRData() {
    const title = document.getElementById('ocr-title-input').value.trim();
    const amount = parseFloat(document.getElementById('ocr-amount-input').value);
    const note = document.getElementById('ocr-note-input').value.trim();
    
    // Set form fields
    const titleEl = document.getElementById('et');
    const priceEl = document.getElementById('ep');
    const noteEl = document.getElementById('en');
    
    if (titleEl) titleEl.value = title;
    if (priceEl) priceEl.value = amount || '';
    if (noteEl) noteEl.value = note;
    
    closeOCRModal();
}'''

new_apply = '''function applyOCRData() {
    const title = document.getElementById('ocr-title-input').value.trim();
    const amount = parseFloat(document.getElementById('ocr-amount-input').value);
    const note = document.getElementById('ocr-note-input').value.trim();
    const dateStr = document.getElementById('ocr-date-input').value;
    
    // Set form fields
    const titleEl = document.getElementById('et');
    const priceEl = document.getElementById('ep');
    const noteEl = document.getElementById('en');
    
    if (titleEl) titleEl.value = title;
    if (priceEl) priceEl.value = amount || '';
    if (noteEl) noteEl.value = note;
    
    // Update selected date to match receipt date
    if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            AppState.currentDate = new Date(year, month, day);
            render();
        }
    }
    
    closeOCRModal();
}'''

content = content.replace(old_apply, new_apply)

with open('app.js', 'w') as f:
    f.write(content)

print("Updated applyOCRData to handle date")

