
import { incrementGlobalPosterCount } from './stats.js';

// Scale Management
export function updatePreviewScale() {
    const previewArea = document.querySelector('.preview-area');
    const printContainer = document.getElementById('printContainer');

    if (!previewArea || !printContainer) return;

    // Reset to measure natural size
    printContainer.style.transform = 'none';
    printContainer.style.margin = '0';

    // Get available dimensions inside preview-area (minus padding)
    const style = window.getComputedStyle(previewArea);
    const padLeft = parseFloat(style.paddingLeft);
    const padRight = parseFloat(style.paddingRight);
    const padTop = parseFloat(style.paddingTop);
    const padBottom = parseFloat(style.paddingBottom);

    const availableWidth = previewArea.clientWidth - padLeft - padRight;
    const availableHeight = previewArea.clientHeight - padTop - padBottom;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const naturalWidth = printContainer.offsetWidth;
    const naturalHeight = printContainer.offsetHeight;

    // Force width/height to prevent squashing before transform
    printContainer.style.minWidth = `${naturalWidth}px`;
    printContainer.style.width = `${naturalWidth}px`;
    printContainer.style.minHeight = `${naturalHeight}px`;
    printContainer.style.height = `${naturalHeight}px`;

    // Calculate Scale with safety margin
    const safetyMargin = 0.95;
    const scaleX = (availableWidth / naturalWidth) * safetyMargin;
    const scaleY = (availableHeight / naturalHeight) * safetyMargin;
    const scale = Math.min(scaleX, scaleY, 1.0);

    // Apply Center & Scale
    printContainer.style.transformOrigin = 'top center';
    printContainer.style.transform = `scale(${scale})`;

    // Add vertical centering
    const scaledHeight = naturalHeight * scale;
    const verticalGap = (availableHeight - scaledHeight) / 2;

    if (verticalGap > 0) {
        printContainer.style.marginTop = `${verticalGap}px`;
    } else {
        printContainer.style.marginTop = '0px';
    }

    // NEW: Remove the empty space below caused by scaling
    const hiddenGap = naturalHeight - scaledHeight;
    printContainer.style.marginBottom = `-${hiddenGap}px`;
}

export function initMobileScale() {
    window.addEventListener('resize', () => requestAnimationFrame(updatePreviewScale));
    // Trigger on load and after short delays for layout settlement
    window.addEventListener('load', updatePreviewScale);
    setTimeout(updatePreviewScale, 100);
    setTimeout(updatePreviewScale, 500);
    setTimeout(updatePreviewScale, 1000);

    // Initial calculation
    updatePreviewScale();
}

// Hook into print to count posters
const originalPrint = window.print;
window.print = function () {
    incrementGlobalPosterCount();
    originalPrint();
};
