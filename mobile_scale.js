
function updatePreviewScale() {
    const previewArea = document.querySelector('.preview-area');
    const printContainer = document.getElementById('printContainer');

    // Always scale to fit, regardless of device
    // Reset to measure natural size
    printContainer.style.transform = 'none';
    printContainer.style.width = '';
    printContainer.style.margin = '0'; // Reset margin to allow accurate measurement

    const previewWidth = previewArea.clientWidth - 40; // 40px padding total
    const previewHeight = previewArea.clientHeight - 40; // Check height too for desktop

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
    const scale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1.0 (pixelated), but shrink to fit
    // Actually, user might want to see A5 bigger? 
    // Usually preview means "show whole page". 
    // Let's cap at 1.0 for clarity, or maybe 1.2? 
    // Let's stick to min(..., 1) to avoid blur, unless screen is huge. 
    // Actually, on desktop, fitting A5 (148mm) on a 1920px screen is fine.

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

    // Prevent scrolling if it fits
    if (finalHeight <= previewArea.clientHeight) {
        previewArea.style.overflow = 'hidden';
    } else {
        previewArea.style.overflow = 'auto'; // allow scroll if somehow vertical overrides
        // In "contain" logic (scaleY), it should always fit vertical unless min scale is hit??
        // scaling ensures it fits.
    }
}

window.addEventListener('resize', updatePreviewScale);
// Call after sidebar moves or init
window.addEventListener('load', updatePreviewScale);
// Note: script.js calls this function manually after updating the poster.
