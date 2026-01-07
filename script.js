const elements = {
    offerText: document.getElementById('offerText'),
    productName: document.getElementById('productName'),
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
    elements.productDetail.addEventListener('input', (e) => { defaults.detail = e.target.value; updateAllCardsWithDefaults(); });
    elements.productPrice.addEventListener('input', (e) => { defaults.price = e.target.value; updateAllCardsWithDefaults(); });
    elements.productUnit.addEventListener('change', (e) => { defaults.unit = e.target.value; updateAllCardsWithDefaults(); });

    // Font Size Controls
    const fontInputs = ['fsOffer', 'fsName', 'fsDetail', 'fsPrice'];
    const cssVars = ['--fs-offer', '--fs-name', '--fs-detail', '--fs-price'];

    // Default values for 1-up layout (matches CSS)
    const defaultFonts = {
        'fsOffer': 5,
        'fsName': 6,
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

    document.getElementById('resetFonts').addEventListener('click', () => {
        fontInputs.forEach((id, index) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = defaultFonts[id] || '';
                elements.printContainer.style.setProperty(cssVars[index], `${input.value}rem`);
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
    offer.contentEditable = true; // Make editable
    offer.oninput = (e) => { cardsState[index].offer = e.target.innerText; };

    // Editable Fields
    const name = document.createElement('div');
    name.className = 'product-name';
    name.innerText = data.name;
    name.contentEditable = true;
    name.oninput = (e) => { cardsState[index].name = e.target.innerText; };

    const detail = document.createElement('div');
    detail.className = 'product-detail';
    detail.innerText = data.detail;
    detail.contentEditable = true;
    detail.oninput = (e) => { cardsState[index].detail = e.target.innerText; };

    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';

    const currency = document.createElement('span');
    currency.className = 'currency';
    currency.innerText = 'R$';

    const priceVal = document.createElement('span');
    priceVal.className = 'price-value';
    priceVal.innerText = data.price;
    priceVal.contentEditable = true;
    priceVal.oninput = (e) => { cardsState[index].price = e.target.innerText; };

    const unitVal = document.createElement('span');
    unitVal.className = 'unit-value';
    unitVal.style.fontSize = "0.4em";
    unitVal.innerText = data.unit ? ` /${data.unit}` : '';
    // Unit changing via contenteditable is tricky, let's leave it controllable via global or maybe click-to-cycle? 
    // For now, let's just render it. If user wants different units, they might need to type it in price or we add a complex editor.
    // Let's assume price/name editing is the main need.

    priceContainer.appendChild(currency);
    priceContainer.appendChild(priceVal);
    priceContainer.appendChild(unitVal);

    content.appendChild(offer);
    content.appendChild(name);
    if (data.detail) content.appendChild(detail);
    content.appendChild(priceContainer);

    card.appendChild(content);

    return card;
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
