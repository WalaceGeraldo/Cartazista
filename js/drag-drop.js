
// Drag and Drop & Resizing Logic

let selectedElement = null;
let activeResizeElement = null;
let activeDragElement = null;
let resizeHandleType = null;

// State for Drag/Resize
let resizeStartX = 0;
let resizeStartY = 0;
let initialScaleX = 1;
let initialScaleY = 1;
let initialWidth = 0;
let initialHeight = 0;
let initialRotation = 0;
let rotationCenterX = 0;
let rotationCenterY = 0;
let startMouseAngle = 0;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;

// Helper to get current scale of container (for coordinate mapping)
function getContainerScale() {
    const container = document.getElementById('printContainer');
    if (!container) return 1;

    // Parse inline style first (most accurate for mobile-scale)
    const transform = container.style.transform;
    const match = transform && transform.match(/scale\(([^)]+)\)/);
    if (match) {
        return parseFloat(match[1]);
    }

    const style = window.getComputedStyle(container);
    const matrix = style.transform;
    if (matrix && matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        return parseFloat(values[0]); // scaleX
    }
    return 1;
}

export function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove('selected-element');
        const handles = selectedElement.querySelectorAll('.resize-handle');
        handles.forEach(h => h.remove());
        selectedElement = null;
    }
}

export function selectElement(element) {
    if (selectedElement === element) return;
    deselectElement();

    selectedElement = element;
    selectedElement.classList.add('selected-element');

    // Create Handles
    const handleE = createHandle('e');
    const handleS = createHandle('s');
    const handleSE = createHandle('se');
    const handleRot = createHandle('rot');

    selectedElement.appendChild(handleE);
    selectedElement.appendChild(handleS);
    selectedElement.appendChild(handleSE);
    selectedElement.appendChild(handleRot);
}

function createHandle(type) {
    const handle = document.createElement('div');
    handle.className = `resize-handle handle-${type}`;
    handle.dataset.type = type;

    if (type === 'rot') {
        handle.addEventListener('mousedown', initRotate);
        handle.addEventListener('touchstart', initRotate, { passive: false });
    } else {
        handle.addEventListener('mousedown', initResize);
        handle.addEventListener('touchstart', initResize, { passive: false });
    }
    return handle;
}

// --- DRAG LOGIC ---

export function makeDraggable(element) {
    if (!element) return;
    element.classList.add('draggable');
    element.style.position = 'relative';
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart, { passive: false });
}

function dragStart(e) {
    let clientX, clientY;
    if (e.type === 'touchstart') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        if (e.button !== 0) return;
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const target = e.currentTarget;
    if (target.isContentEditable) return;

    activeDragElement = target;

    // Select instantly
    if (activeDragElement !== selectedElement) {
        selectElement(activeDragElement);
    }

    const currentScale = getContainerScale() || 1;

    if (e.type === 'touchstart' || !target.isContentEditable) {
        e.preventDefault();
    }

    // Force relative
    if (window.getComputedStyle(activeDragElement).position === 'static') {
        activeDragElement.style.position = 'relative';
    }

    dragStartX = clientX;
    dragStartY = clientY;

    initialLeft = parseFloat(activeDragElement.style.left) || 0;
    initialTop = parseFloat(activeDragElement.style.top) || 0;

    if (e.type === 'touchstart') {
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);
    } else {
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }
}

function drag(e) {
    if (!activeDragElement) return;
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const currentScale = getContainerScale() || 1;
    const dx = (clientX - dragStartX) / currentScale;
    const dy = (clientY - dragStartY) / currentScale;

    activeDragElement.style.left = `${initialLeft + dx}px`;
    activeDragElement.style.top = `${initialTop + dy}px`;
}

function dragEnd() {
    activeDragElement = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', dragEnd);
}

// --- RESIZE LOGIC ---

function initResize(e) {
    e.stopPropagation();
    e.preventDefault();

    activeResizeElement = selectedElement;
    resizeHandleType = e.target.dataset.type;

    let clientX, clientY;
    if (e.type === 'touchstart') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    resizeStartX = clientX;
    resizeStartY = clientY;

    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    initialScaleX = matrix.a;
    initialScaleY = matrix.d;

    initialWidth = activeResizeElement.offsetWidth;
    initialHeight = activeResizeElement.offsetHeight;

    if (e.type === 'touchstart') {
        document.addEventListener('touchmove', doResize, { passive: false });
        document.addEventListener('touchend', stopResize);
    } else {
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }
}

function doResize(e) {
    if (!activeResizeElement) return;
    e.preventDefault();
    e.stopPropagation();

    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const currentScale = getContainerScale() || 1;
    const dx = (clientX - resizeStartX) / currentScale;
    const dy = (clientY - resizeStartY) / currentScale;

    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    let newScaleX = initialScaleX;
    let newScaleY = initialScaleY;

    if (resizeHandleType === 'e' || resizeHandleType === 'se') {
        const newWidth = initialWidth + dx;
        if (newWidth > 20) {
            newScaleX = (newWidth / initialWidth) * initialScaleX;
        }
    }

    if (resizeHandleType === 's' || resizeHandleType === 'se') {
        const newHeight = initialHeight + dy;
        if (newHeight > 10) {
            newScaleY = (newHeight / initialHeight) * initialScaleY;
        }
    }

    activeResizeElement.style.transform = `rotate(${currentAngle}deg) scale(${newScaleX}, ${newScaleY})`;
}

function stopResize() {
    activeResizeElement = null;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
}

// --- ROTATION LOGIC ---

function initRotate(e) {
    e.stopPropagation();
    e.preventDefault();

    activeResizeElement = selectedElement;

    const rect = activeResizeElement.getBoundingClientRect();
    rotationCenterX = rect.left + rect.width / 2;
    rotationCenterY = rect.top + rect.height / 2;

    let clientX, clientY;
    if (e.type === 'touchstart') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    startMouseAngle = Math.atan2(clientY - rotationCenterY, clientX - rotationCenterX);

    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    initialRotation = Math.atan2(matrix.b, matrix.a);

    if (e.type === 'touchstart') {
        document.addEventListener('touchmove', doRotate, { passive: false });
        document.addEventListener('touchend', stopRotate);
    } else {
        document.addEventListener('mousemove', doRotate);
        document.addEventListener('mouseup', stopRotate);
    }
}

function doRotate(e) {
    if (!activeResizeElement) return;
    e.preventDefault();
    e.stopPropagation();

    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const currentMouseAngle = Math.atan2(clientY - rotationCenterY, clientX - rotationCenterX);
    const deltaAngle = currentMouseAngle - startMouseAngle;

    const newRotationRad = initialRotation + deltaAngle;
    const newRotationDeg = newRotationRad * (180 / Math.PI);

    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    const currentScaleX = Math.hypot(matrix.a, matrix.b);
    const currentScaleY = Math.hypot(matrix.c, matrix.d);

    activeResizeElement.style.transform = `rotate(${newRotationDeg}deg) scale(${currentScaleX}, ${currentScaleY})`;
}

function stopRotate() {
    activeResizeElement = null;
    document.removeEventListener('mousemove', doRotate);
    document.removeEventListener('mouseup', stopRotate);
    document.removeEventListener('touchmove', doRotate);
    document.removeEventListener('touchend', stopRotate);
}

// Global click to deselect
document.addEventListener('click', (e) => {
    if (!e.target.closest('.draggable') && !e.target.closest('.resize-handle')) {
        deselectElement();
    }
});
