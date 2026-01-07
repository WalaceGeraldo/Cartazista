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

// Global Configuration
let config = {
    theme: "white",
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

    const unitVal = document.createElement('span');
    unitVal.className = 'unit-value';
    unitVal.style.fontSize = "0.4em";
    unitVal.innerText = data.unit ? ` /${data.unit}` : '';

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

    element.addEventListener('dblclick', (e) => {
        e.stopPropagation(); // prevent triggering drag start if bubbles
        element.contentEditable = true;
        element.focus();
        element.classList.add('editing');
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
