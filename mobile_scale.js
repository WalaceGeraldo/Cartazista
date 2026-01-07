
function updatePreviewScale() {
    const previewArea = document.querySelector('.preview-area');
    const printContainer = document.getElementById('printContainer');

    // Always scale to fit, regardless of device
    // Reset to measure natural size
    printContainer.style.transform = 'none';
    printContainer.style.width = '';
    printContainer.style.margin = '0'; // Reset margin to allow accurate measurement

    const previewWidth = previewArea.clientWidth - 20; // 20px padding total
    const previewHeight = previewArea.clientHeight - 20; // Check height too for desktop

    // Reset parent alignment to prevent double-centering (Flex center + JS translate)
    previewArea.style.justifyContent = 'flex-start';
    previewArea.style.alignItems = 'flex-start';

    // Force constraints if CSS didn't apply yet (unlikely but safe)
    // printContainer gets size from class (.paper-a4 etc), so offsetWidth is correct.
    const naturalWidth = printContainer.offsetWidth;
    const naturalHeight = printContainer.offsetHeight;

    // Calculate Scale to fit both width and height (contain)
    const scaleX = previewWidth / naturalWidth;
    const scaleY = previewHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY); // Allow scaling > 1 to fill screen

    // Apply transform
    // Center it.
    // Scaled dimensions:
    const finalWidth = naturalWidth * scale;
    const finalHeight = naturalHeight * scale;

    const offsetX = (previewArea.clientWidth - finalWidth) / 2;
    const offsetY = (previewArea.clientHeight - finalHeight) / 2;

    // We used transformOrigin top left previously.
    printContainer.style.transformOrigin = 'top left';
    printContainer.style.transform = `translate(${offsetX}px, ${Math.max(offsetY, 20)}px) scale(${scale})`;

    // Prevent scrolling - we want it contained
    previewArea.style.overflow = 'hidden';
}

window.addEventListener('resize', updatePreviewScale);
// Call after sidebar moves or init
window.addEventListener('load', updatePreviewScale);
// Note: script.js calls this function manually after updating the poster.
