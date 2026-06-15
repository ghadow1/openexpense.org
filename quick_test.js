// Quick test to verify OCR button renders
console.log("=== OCR Button Rendering Test ===\n");

// Check if Tesseract is loaded
if (typeof Tesseract !== 'undefined') {
    console. Tesseract.js library is available");log("
} else {
    console. Tesseract.js library not yet loaded (will load from CDN)");log("
}

// Test UI button creation (simplified version of what the app does)
const testColors = {
    text: '#333',
    btnBg: '#fff',
    border: '#ccc',
    accent: '#6366f1'
};

// Create a test camera button
const testBtn = document.createElement('button');
testBtn.innerHTML = '<i class="ti ti-camera"></i>';
testBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 8px;
    border: 1px solid ${testColors.border};
    background: ${testColors.btnBg};
    border-radius: 6px;
    cursor: pointer;
`;
testBtn.title = 'Scan receipt image with OCR';
testBtn.onclick = () => console. Camera button clicked!");log("

document.body.appendChild(testBtn);
console. Camera button created and appended to body");log("

// Test OCR functions exist
const functionsToTest = [
    'performOCR',
    'parseReceiptText',
    'showOCRPreviewModal',
    'closeOCRModal', 
    'applyOCRData',
    'triggerOCRUpload'
];

console.log("\ OCR Functions Status:");n
functionsToTest.forEach(fname => {
    if (typeof window[fname] === 'function') {
        console. ${fname}() is defined`);log(`  
    } else {
        console. ${fname}() NOT FOUND`);log(`  
    }
});

console.log("\n=== Test Complete ===");
