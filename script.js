const elements = {
    offerText: document.getElementById('offerText'),
    productName: document.getElementById('productName'),
    productCategory: document.getElementById('productCategory'),
    productDetail: document.getElementById('productDetail'),
    productPrice: document.getElementById('productPrice'),
    productUnit: document.getElementById('productUnit'),
    backgroundTheme: document.getElementById('backgroundTheme'),
    paperSize: document.getElementById('paperSize'),
    orientation: document.getElementById('orientation'),
    gridLayout: document.getElementById('gridLayout'),
    printContainer: document.getElementById('printContainer'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    appContainer: document.querySelector('.app-container')
};

// Resizing State
let activeResizeElement = null; // The element being resized
let resizeHandleType = null; // 'e', 's', 'se'
let resizeStartX = 0;
let resizeStartY = 0;
let initialScaleX = 1;
let initialScaleY = 1;
let initialWidth = 0;
let initialHeight = 0;
// Rotation State
let initialRotation = 0;
let rotationCenterX = 0;
let rotationCenterY = 0;
let startMouseAngle = 0;

// Selection State
let selectedElement = null;

// --- Interactive Resizing Logic ---

// Deselect when clicking empty space
document.addEventListener('click', (e) => {
    if (!e.target.closest('.draggable') && !e.target.closest('.resize-handle')) {
        deselectElement();
    }
});

function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove('selected-element');
        // Remove handles
        const handles = selectedElement.querySelectorAll('.resize-handle');
        handles.forEach(h => h.remove());
        selectedElement = null;
    }
}

function selectElement(element) {
    if (selectedElement === element) return; // Already selected
    deselectElement();

    selectedElement = element;
    selectedElement.classList.add('selected-element');

    // Create Handles
    const handleE = createHandle('e');
    const handleS = createHandle('s');
    const handleSE = createHandle('se');
    const handleRot = createHandle('rot'); // Added

    selectedElement.appendChild(handleE);
    selectedElement.appendChild(handleS);
    selectedElement.appendChild(handleSE);
    selectedElement.appendChild(handleRot); // Added
}

function createHandle(type) {
    const handle = document.createElement('div');
    handle.className = `resize-handle handle-${type}`;
    handle.dataset.type = type;

    // Mouse events
    if (type === 'rot') {
        handle.addEventListener('mousedown', initRotate);
        handle.addEventListener('touchstart', initRotate, { passive: false });
    } else {
        handle.addEventListener('mousedown', initResize);
        handle.addEventListener('touchstart', initResize, { passive: false });
    }

    return handle;
}

function initResize(e) {
    e.stopPropagation(); // Stop drag or selection
    e.preventDefault(); // Prevent text selection/scroll

    activeResizeElement = selectedElement;
    resizeHandleType = e.target.dataset.type;

    // Calculate current scale of the container to adjust mouse movement (Copied from dragStart)
    const container = document.getElementById('printContainer');
    // We try to parse the inline style first as it's most accurate from mobile_scale.js
    const transform = container.style.transform;
    const match = transform && transform.match(/scale\(([^)]+)\)/);
    if (match) {
        currentScale = parseFloat(match[1]);
    } else {
        // Fallback to computed style (matrix)
        const style = window.getComputedStyle(container);
        const matrix = style.transform; // matrix(a, b, c, d, tx, ty)
        if (matrix && matrix !== 'none') {
            const values = matrix.split('(')[1].split(')')[0].split(',');
            currentScale = parseFloat(values[0]); // a = scaleX
        } else {
            currentScale = 1;
        }
    }
    if (!currentScale || currentScale <= 0) currentScale = 1;

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

    // Get current scale (parse transform)
    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    initialScaleX = matrix.a; // scale X
    initialScaleY = matrix.d; // scale Y

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

    // Delta adjusted by global zoom/scale if needed. 
    // Assuming container scale is handled by DOMMatrix or we need to divide by currentScale like drag.

    const dx = (clientX - resizeStartX) / currentScale;
    const dy = (clientY - resizeStartY) / currentScale;

    // Get current rotation to preserve it
    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    // Extract angle from matrix (a,b)
    // angle = atan2(b, a)
    let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    let newScaleX = initialScaleX;
    let newScaleY = initialScaleY;

    // Calculate new scale based on dimension change
    // Using simple ratio: (originalWidth + dx) / originalWidth * originalScale

    if (resizeHandleType === 'e' || resizeHandleType === 'se') {
        // Horizontal Stretch
        const newWidth = initialWidth + dx;
        if (newWidth > 20) { // Min width
            // ratio * oldScale
            newScaleX = (newWidth / initialWidth) * initialScaleX;
        }
    }

    if (resizeHandleType === 's' || resizeHandleType === 'se') {
        // Vertical Stretch
        const newHeight = initialHeight + dy;
        if (newHeight > 10) { // Min height
            newScaleY = (newHeight / initialHeight) * initialScaleY;
        }
    }

    activeResizeElement.style.transform = `rotate(${currentAngle}deg) scale(${newScaleX}, ${newScaleY})`;
}

// --- Rotation Logic ---

function initRotate(e) {
    e.stopPropagation();
    e.preventDefault();

    activeResizeElement = selectedElement;

    // Calculate Center
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

    // Start Angle relative to center
    startMouseAngle = Math.atan2(clientY - rotationCenterY, clientX - rotationCenterX);

    // Initial Rotation from CSS
    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    // angle in radians for calculation? No, let's store deg
    initialRotation = Math.atan2(matrix.b, matrix.a); // Radians

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

    // Preserve Scale
    const style = window.getComputedStyle(activeResizeElement);
    const matrix = new DOMMatrix(style.transform);
    // Extract scale. Math.hypot(a,b) = scaleX (if no skew)
    const currentScaleX = Math.hypot(matrix.a, matrix.b);
    const currentScaleY = Math.hypot(matrix.c, matrix.d);

    // We already have 'initialScaleX' variables but they are for resize... 
    // Let's trust the matrix for current scale fidelity during rotation.
    // Actually, 'initResize' sets initialScaleX, initRotate does not.
    // So we should just use the computed values or keep state.
    // Simpler: Just extract from matrix now.

    activeResizeElement.style.transform = `rotate(${newRotationDeg}deg) scale(${currentScaleX}, ${currentScaleY})`;
}

function stopRotate(e) {
    activeResizeElement = null;
    document.removeEventListener('mousemove', doRotate);
    document.removeEventListener('mouseup', stopRotate);
    document.removeEventListener('touchmove', doRotate);
    document.removeEventListener('touchend', stopRotate);
}

function stopResize(e) {
    activeResizeElement = null;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
}

// Global Configuration
let config = {
    theme: "vector", // Changed from "white" to "vector"
    paper: "A4",
    orientation: "portrait",
    layout: 1
};

// Default values for new cards or bulk update
let defaults = {
    offer: "OFERTA",
    name: "BANANA PRATA",
    detail: "GRAÚDA",
    price: "88,88",
    unit: ""
};

// Array to hold state for each card position
let cardsState = [];

function init() {
    // Initialize cards based on default layout
    updateCardsState();
    addEventListeners();
    updatePoster();
}

function updateCardsState() {
    // Resize array to match layout
    const currentLength = cardsState.length;
    const targetLength = config.layout;

    if (targetLength > currentLength) {
        // Add new cards with current default values
        for (let i = currentLength; i < targetLength; i++) {
            cardsState.push({ ...defaults });
        }
    } else if (targetLength < currentLength) {
        // Trim array
        cardsState.length = targetLength;
    }
    // If equal, do nothing (preserve data)
}

function updateAllCardsWithDefaults() {
    // When sidebar inputs change, overwrite all cards
    cardsState = cardsState.map(() => ({ ...defaults }));
    updatePoster();
}

function addEventListeners() {
    // Inputs (Bulk actions)
    elements.offerText.addEventListener('input', (e) => { defaults.offer = e.target.value; updateAllCardsWithDefaults(); });
    elements.productName.addEventListener('input', (e) => { defaults.name = e.target.value; updateAllCardsWithDefaults(); });
    elements.productCategory.addEventListener('input', (e) => { defaults.category = e.target.value; updateAllCardsWithDefaults(); });
    elements.productDetail.addEventListener('input', (e) => { defaults.detail = e.target.value; updateAllCardsWithDefaults(); });
    elements.productPrice.addEventListener('input', (e) => { defaults.price = e.target.value; updateAllCardsWithDefaults(); });
    elements.productUnit.addEventListener('change', (e) => { defaults.unit = e.target.value; updateAllCardsWithDefaults(); });

    // Font Size Controls
    const fontInputs = ['fsOffer', 'fsName', 'fsCategory', 'fsDetail', 'fsPrice'];
    const cssVars = ['--fs-offer', '--fs-name', '--fs-category', '--fs-detail', '--fs-price'];

    // Default values for 1-up layout (matches CSS)
    const defaultFonts = {
        'fsOffer': 5,
        'fsName': 6,
        'fsCategory': 2.5,
        'fsDetail': 3,
        'fsPrice': 9
    };

    fontInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        if (input) {
            // Pre-fill with default
            if (defaultFonts[id]) {
                input.value = defaultFonts[id];
            }

            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val) {
                    elements.printContainer.style.setProperty(cssVars[index], `${val}rem`);
                } else {
                    elements.printContainer.style.removeProperty(cssVars[index]);
                }
            });
        }
    });

    // Vertical Scale Controls
    const scaleInputs = ['scaleOffer', 'scaleName', 'scaleCategory', 'scaleDetail', 'scalePrice'];
    const scaleVars = ['--scale-y-offer', '--scale-y-name', '--scale-y-category', '--scale-y-detail', '--scale-y-price'];

    scaleInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val) {
                    elements.printContainer.style.setProperty(scaleVars[index], val);
                } else {
                    elements.printContainer.style.removeProperty(scaleVars[index]);
                }
            });
        }
    });

    document.getElementById('resetFonts').addEventListener('click', () => {
        // Reset Fonts
        fontInputs.forEach((id, index) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = defaultFonts[id] || '';
                elements.printContainer.style.setProperty(cssVars[index], `${input.value}rem`);
            }
        });

        // Reset Scales
        scaleInputs.forEach((id, index) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = "1.0";
                elements.printContainer.style.setProperty(scaleVars[index], "1");
            }
        });
    });

    // Theme & Layout (Preserve content, update view)
    elements.backgroundTheme.addEventListener('change', (e) => { config.theme = e.target.value; updatePoster(); });

    elements.paperSize.addEventListener('change', (e) => { config.paper = e.target.value; updatePoster(); });
    elements.orientation.addEventListener('change', (e) => { config.orientation = e.target.value; updatePoster(); });

    elements.gridLayout.addEventListener('change', (e) => {
        config.layout = parseInt(e.target.value);
        updateCardsState();

        // Reset Font Inputs and Inline Styles for new layout
        const layoutDefaults = {
            1: { 'fsOffer': 5, 'fsName': 6, 'fsDetail': 3, 'fsPrice': 9 },
            2: { 'fsOffer': 4, 'fsName': 4.5, 'fsDetail': 2.5, 'fsPrice': 7 },
            4: { 'fsOffer': 3, 'fsName': 3.5, 'fsDetail': 2, 'fsPrice': 5.5 },
            8: { 'fsOffer': 2, 'fsName': 2.2, 'fsDetail': 1.4, 'fsPrice': 4 }
        };

        const newDefaults = layoutDefaults[config.layout] || layoutDefaults[1];
        const fontInputs = ['fsOffer', 'fsName', 'fsDetail', 'fsPrice'];
        const cssVars = ['--fs-offer', '--fs-name', '--fs-detail', '--fs-price'];

        fontInputs.forEach((id, index) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = newDefaults[id];
                elements.printContainer.style.removeProperty(cssVars[index]);
            }
        });

        updatePoster();
    });

    // Sidebar Toggle
    elements.sidebarToggle.addEventListener('click', () => {
        elements.appContainer.classList.toggle('collapsed');
        const isCollapsed = elements.appContainer.classList.contains('collapsed');

        // On desktop: < (hide) > (show)
        // On mobile: we might want different icons, but < > works okay if we think of it as "Slide menu".
        // Let's keep existing logic but just update the arrow.
        elements.sidebarToggle.innerText = isCollapsed ? '▶' : '◀';

        // Trigger resize for mobile scale check if on mobile, 
        // but even on desktop, if preview area grows, we might want to check fitting if we had logic for that.
        // For now, mainly ensures mobile_scale.js re-evaluates if present.
        setTimeout(updatePreviewScale, 305); // Wait for transition
    });
}

function updatePrintSettings() {
    let existingStyle = document.getElementById('dynamic-print-style');
    if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = 'dynamic-print-style';
        document.head.appendChild(existingStyle);
    }

    const { paper, orientation } = config;

    const css = `
        @page {
            size: ${paper} ${orientation};
            margin: 0;
        }
    `;
    existingStyle.innerHTML = css;
}

function updatePoster() {
    const pc = elements.printContainer;
    pc.className = 'print-container';
    pc.classList.add(`paper-${config.paper.toLowerCase()}`);
    pc.classList.add(config.orientation);
    pc.classList.add(`layout-${config.layout}`);

    pc.innerHTML = '';

    // Render from cardsState
    cardsState.forEach((cardData, index) => {
        const card = createPosterCard(cardData, index);
        pc.appendChild(card);
    });

    updatePrintSettings();

    // Update preview scale if function exists (responsive behavior)
    if (typeof updatePreviewScale === 'function') {
        // Small timeout to ensure rendering is complete if needed, 
        // though usually synchronous reflow works. 
        // Let's force a next-tick to be safe against browser rendering quirks.
        setTimeout(updatePreviewScale, 0);
    }
}

function createPosterCard(data, index) {
    const card = document.createElement('div');
    card.className = 'poster-card';
    if (config.theme === 'vector') {
        card.classList.add('theme-vector');
    }

    const content = document.createElement('div');
    content.className = 'content';

    const offer = document.createElement('div');
    offer.className = 'offer-label';
    offer.innerText = data.offer; // Use state data
    setupInteraction(offer, index, 'offer');

    // Editable Fields
    const name = document.createElement('div');
    name.className = 'product-name';
    name.innerText = data.name;
    setupInteraction(name, index, 'name');

    // New Category Element
    const category = document.createElement('div');
    category.className = 'product-category';
    // Only show if it has text
    if (data.category) {
        category.innerText = data.category;
        setupInteraction(category, index, 'category');
    }

    const detail = document.createElement('div');
    detail.className = 'product-detail';

    detail.innerText = data.detail;
    setupInteraction(detail, index, 'detail');

    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';

    const currency = document.createElement('span');
    currency.className = 'currency';
    currency.innerText = 'R$';

    const priceVal = document.createElement('span');
    priceVal.className = 'price-value';
    priceVal.innerText = data.price;
    // Removed redundant setupInteraction(priceVal) to avoid conflict with manual setup below


    // Better strategy for price: 
    // The Container is draggable.
    // The Value inside is editable.
    // If I double click the container, I might want to edit the price.

    // Let's attach interaction to priceVal specifically for editing, 
    // AND attach DRAG to priceContainer.

    // But wait, setupInteraction does both?
    // Price Value needs to be editable
    priceVal.contentEditable = false;
    priceVal.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        priceVal.contentEditable = true;
        priceVal.focus();
    });
    priceVal.addEventListener('blur', () => {
        priceVal.contentEditable = false;
        cardsState[index].price = priceVal.innerText;
    });
    priceVal.addEventListener('input', (e) => {
        cardsState[index].price = e.target.innerText;
    });

    // Added: Click to Select for Resizing
    // Added: Click to Select for Resizing
    // UPDATED: Now clicking price selects the whole Container to resize R$ + Value + Unit together
    const unitVal = document.createElement('span');
    unitVal.className = 'unit-value';
    unitVal.style.fontSize = "0.4em";
    unitVal.innerText = data.unit ? ` /${data.unit}` : '';

    // Added: Click to Select for Resizing
    // UPDATED: Now clicking price selects the whole Container to resize R$ + Value + Unit together
    const selectContainer = (e) => {
        e.stopPropagation();
        if (!activeResizeElement) {
            selectElement(priceContainer);
        }
    };

    priceVal.addEventListener('click', selectContainer);
    currency.addEventListener('click', selectContainer);
    unitVal.addEventListener('click', selectContainer);

    priceContainer.appendChild(currency);
    priceContainer.appendChild(priceVal);
    priceContainer.appendChild(unitVal);

    // Make the whole container draggable
    makeDraggable(priceContainer);
    // BUT, double clicking the container (outside priceVal) triggers what?
    // Maybe nothing, or we focus priceVal? 
    // For now, let's keep it simple: drag container, dblclick price number to edit.

    // Remove redundant makeDraggable calls from previous step


    content.appendChild(offer);
    content.appendChild(name);
    if (data.category) content.appendChild(category); // Append Category
    if (data.detail) content.appendChild(detail);
    content.appendChild(priceContainer);

    card.appendChild(content);

    return card;
}

// Helper to manage Drag + Edit
function setupInteraction(element, dataIndex, dataField) {
    // 1. Dragging
    makeDraggable(element);

    // 2. Editing (Double Click)
    element.contentEditable = false; // Start forbidden

    // Selection (Click)
    element.addEventListener('click', (e) => {
        // e.stopPropagation(); // Let it bubble to allow deselect? No, click on item selects it.
        e.stopPropagation();
        if (!activeResizeElement) { // Don't select if currently resizing
            selectElement(element);
        }
    });

    element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        element.contentEditable = true;
        element.focus();
        element.classList.add('editing');
        // Edit mode implies selection too, mostly.
        selectElement(element);
        // Optional: select all text
        // document.execCommand('selectAll', false, null);
    });

    element.addEventListener('blur', () => {
        element.contentEditable = false;
        element.classList.remove('editing');
        // Save data
        if (dataIndex !== undefined && dataField) {
            cardsState[dataIndex][dataField] = element.innerText;
        }
    });

    // Input listener to sync state while editing
    element.addEventListener('input', (e) => {
        if (dataIndex !== undefined && dataField) {
            cardsState[dataIndex][dataField] = e.target.innerText;
        }
    });
}

// Drag and Drop Logic
let activeDragElement = null;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;
let currentScale = 1;

function makeDraggable(element) {
    if (!element) return;
    // console.log('Making draggable:', element.className, element.innerText);
    element.classList.add('draggable');
    element.style.position = 'relative'; // FORCE relative immediately
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart, { passive: false });
}

function dragStart(e) {
    // console.log('Drag Start Triggered', e.type);
    // Determine input type
    let clientX, clientY;
    if (e.type === 'touchstart') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        // Only left click for mouse
        if (e.button !== 0) return;
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const target = e.currentTarget;

    // CRITICAL: Do NOT start drag if we are currently editing this element
    if (target.isContentEditable) return;

    activeDragElement = target;

    // Added: Select instantly on interaction (fixes issue where click was blocked)
    if (activeDragElement !== selectedElement) {
        selectElement(activeDragElement);
    }

    // Calculate current scale of the container to adjust mouse movement
    const container = document.getElementById('printContainer');
    // We try to parse the inline style first as it's most accurate from mobile_scale.js
    const transform = container.style.transform;
    const match = transform && transform.match(/scale\(([^)]+)\)/);
    if (match) {
        currentScale = parseFloat(match[1]);
    } else {
        // Fallback to computed style (matrix)
        const style = window.getComputedStyle(container);
        const matrix = style.transform; // matrix(a, b, c, d, tx, ty)
        if (matrix && matrix !== 'none') {
            const values = matrix.split('(')[1].split(')')[0].split(',');
            currentScale = parseFloat(values[0]); // a = scaleX
        } else {
            currentScale = 1;
        }
    }
    // Safety check
    if (!currentScale || currentScale <= 0) currentScale = 1;

    // Prevent default to stop scrolling on touch
    if (e.type === 'touchstart' || !target.isContentEditable) {
        e.preventDefault();
    }

    // FORCE position relative if not set
    const computedStyle = window.getComputedStyle(activeDragElement);
    if (computedStyle.position === 'static' || !activeDragElement.style.position) {
        activeDragElement.style.position = 'relative';
    }

    dragStartX = clientX;
    dragStartY = clientY;

    // Use inline style for tracking accumulated movement 
    // (computed style might reset to 0 relative to flow if we don't track it)
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

    e.preventDefault(); // Prevent scrolling

    // console.log('Dragging...', e.type);

    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Adjust delta by scale
    const dx = (clientX - dragStartX) / currentScale;
    const dy = (clientY - dragStartY) / currentScale;

    activeDragElement.style.left = `${initialLeft + dx}px`;
    activeDragElement.style.top = `${initialTop + dy}px`;
}

function dragEnd(e) {
    activeDragElement = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', dragEnd);
}


async function downloadPDF() {
    const element = document.getElementById('printContainer');
    const btn = document.getElementById('btnDownloadPdf');

    // Feedback
    const originalText = btn.innerText;
    btn.innerText = "GERANDO...";
    btn.disabled = true;

    // Store original styles
    const originalTransform = element.style.transform;
    const originalMargin = element.style.margin;
    const originalBoxShadow = element.style.boxShadow;
    const originalBorder = element.style.border;
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;

    // Dimensions map in mm
    const paperDims = {
        'A4': { w: 210, h: 297 },
        'A3': { w: 297, h: 420 },
        'A5': { w: 148, h: 210 },
        'Letter': { w: 216, h: 279 },
        'Legal': { w: 216, h: 356 }
    };

    let dim = paperDims[config.paper] || paperDims['A4'];
    // Swap for landscape
    if (config.orientation === 'landscape') {
        dim = { w: dim.h, h: dim.w };
    }

    // 1. Unscale and Enforce Exact Size for capture
    element.style.transform = 'none';
    element.style.margin = '0';
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    // Critical: Force exact dimensions to prevent sub-pixel overflow
    element.style.width = `${dim.w}mm`;
    element.style.height = `${dim.h}mm`; /* Exact match to PDF format */
    element.style.overflow = 'hidden';   /* Clip anything extra */

    // 2. Configure options
    const opt = {
        margin: 0,
        filename: `cartazes-${config.paper}-${config.layout}up.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0,
            width: element.offsetWidth, // Tell html2canvas the exact px width
            height: element.offsetHeight
        },
        jsPDF: { unit: 'mm', format: config.paper.toLowerCase(), orientation: config.orientation }
    };

    // 3. Generate -> Save -> Restore
    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("PDF Generation Error:", err);
        alert("Erro ao gerar PDF. Tente usar o botão Imprimir > Salvar como PDF.");
    } finally {
        // Restore Scale & Styles
        element.style.boxShadow = '';
        element.style.border = '';
        element.style.width = '';
        element.style.height = '';
        element.style.overflow = '';

        btn.innerText = originalText;
        btn.disabled = false;

        if (typeof updatePreviewScale === 'function') {
            updatePreviewScale();
        }
    }
}

init();

// --- AUTHENTICATION & USER MANAGEMENT ---

// Default Admin User
const DEFAULT_ADMIN = {
    id: 1,
    name: 'Administrador',
    email: 'admin@admin.com',
    pass: 'admin',
    role: 'admin'
};

// Functions to interact with User Database (LocalStorage)
function getUsers() {
    const stored = localStorage.getItem('cartazista_users');
    if (!stored) {
        // Initialize with default admin
        const initial = [DEFAULT_ADMIN];
        localStorage.setItem('cartazista_users', JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(stored);
}

function saveUser(name, email, pass) {
    const users = getUsers();
    // Simple validation
    if (!name || !email || !pass) return false;
    if (users.find(u => u.email === email)) {
        alert('Este e-mail já está cadastrado!');
        return false;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        pass: pass,
        role: 'user'
    };

    users.push(newUser);
    localStorage.setItem('cartazista_users', JSON.stringify(users));
    return true;
}

function deleteUser(id) {
    let users = getUsers();
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete && userToDelete.email === 'admin@admin.com') {
        alert('Não é possível remover o super-admin!');
        return;
    }

    if (confirm('Tem certeza que deseja remover este usuário?')) {
        users = users.filter(u => u.id !== id);
        localStorage.setItem('cartazista_users', JSON.stringify(users));
        renderDashboard(); // Refresh
    }
}

function checkSession() {
    const session = localStorage.getItem('cartazista_session');
    if (session) {
        // Logged in
        const user = JSON.parse(session);
        document.getElementById('currentUserDisplay').innerText = user.name || 'Usuário';

        // Redirect based on role
        if (user.role === 'admin' || user.email === 'admin@admin.com') {
            showView('dashboard');
            renderDashboard(); // Load stats and table
        } else {
            // Regular user -> Redirect to App immediately
            showView('app');
        }
    } else {
        showView('login');
    }
}

function login() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const users = getUsers();

    const foundUser = users.find(u => u.email === email && u.pass === password);

    if (foundUser) {
        // Save full user object to session
        localStorage.setItem('cartazista_session', JSON.stringify(foundUser));
        checkSession();
    } else {
        alert('E-mail ou senha incorretos!');
    }
}

function logout() {
    localStorage.removeItem('cartazista_session');
    showView('login');
    document.getElementById('emailInput').value = "";
    document.getElementById('passwordInput').value = "";
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
    const users = getUsers();

    // Update Stats
    document.getElementById('statsUserCount').innerText = users.length;

    // Update Table
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = ''; // Clear

    users.forEach(user => {
        const tr = document.createElement('tr');
        const isMe = user.email === JSON.parse(localStorage.getItem('cartazista_session') || '{}').email;

        tr.innerHTML = `
            <td>
                <strong>${user.name}</strong> 
                ${isMe ? '<span style="color:#f1c40f; font-size:0.8em; margin-left:5px;">(Você)</span>' : ''}
            </td>
            <td>${user.email}</td>
            <td style="text-align:right;">
                ${user.role !== 'admin' || user.email !== 'admin@admin.com' ?
                `<button class="delete-btn" onclick="deleteUser(${user.id})">Excluir</button>` :
                '<span style="color:#666; font-size:0.8rem;">Bloqueado</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MODAL LOGIC ---
const modal = document.getElementById('addUserModal');
const btnShowAdd = document.getElementById('showAddUserBtn');
const btnCancelAdd = document.getElementById('cancelAddUserBtn');
const btnConfirmAdd = document.getElementById('confirmAddUserBtn'); // Fixed ID

if (btnShowAdd) {
    btnShowAdd.addEventListener('click', () => {
        // Clear inputs
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPass').value = '';
        modal.classList.remove('hidden');
    });
}

if (btnCancelAdd) {
    btnCancelAdd.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

if (btnConfirmAdd) {
    btnConfirmAdd.addEventListener('click', () => {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const pass = document.getElementById('newUserPass').value;

        if (saveUser(name, email, pass)) {
            modal.classList.add('hidden');
            renderDashboard(); // Refresh list
            alert('Usuário criado com sucesso!');
        }
    });

    // Make functions global so inline onclicks work
    window.deleteUser = deleteUser;
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

    if (viewName === 'login') {
        document.getElementById('loginView').classList.remove('hidden');
    } else if (viewName === 'dashboard') {
        document.getElementById('dashboardView').classList.remove('hidden');
    } else if (viewName === 'app') {
        document.getElementById('appView').classList.remove('hidden');
        window.dispatchEvent(new Event('resize'));
    }
}

// --- LISTENERS ---
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
}

if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

if (document.getElementById('createPosterBtn')) {
    document.getElementById('createPosterBtn').addEventListener('click', () => {
        showView('app');
    });
}

// Updated: Editor Logout Button
if (document.getElementById('appLogoutBtn')) {
    document.getElementById('appLogoutBtn').addEventListener('click', logout);
}

setTimeout(checkSession, 100);
