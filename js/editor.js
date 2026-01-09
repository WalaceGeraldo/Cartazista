
import { state, updateConfig, updateDefault, updateCard, setCards, subscribe, undo, redo } from './state.js';
import { makeDraggable, selectElement } from './drag-drop.js';
import { updatePreviewScale } from './mobile-scale.js';

const elements = {
    printContainer: document.getElementById('printContainer'),
};

export function initEditor() {
    setupListeners();
    subscribe(renderPoster);
    renderPoster();
}


// Default Font Sizes for Layouts (Matches CSS)
const layoutDefaults = {
    1: { 'offer': 5, 'name': 6, 'category': 3, 'detail': 3, 'price': 9 },
    2: { 'offer': 4, 'name': 4.5, 'category': 2.5, 'detail': 2.5, 'price': 7 },
    4: { 'offer': 3, 'name': 3.5, 'category': 2, 'detail': 3, 'price': 5.5 },
    8: { 'offer': 2, 'name': 2.2, 'category': 1.5, 'detail': 1.4, 'price': 4 }
};

export function setGlobalScale(factor) {
    const layout = state.config.layout || 1;
    const defaults = layoutDefaults[layout] || layoutDefaults[1];

    const container = document.getElementById('printContainer');
    if (!container) return;

    // Scale each variable
    // Note: We are overwriting the --fs-* vars. 
    // If user manually adjusted a specific font, this global scale might overwrite it 
    // OR we should ideally multiply the manual adjustment?
    // User request: "increases all items". 
    // Simplest approach: Reset to (Base * Factor). 
    // This wipes individual adjustments if this slider is moved, which is usually expected behavior for a "Master Scale".

    container.style.setProperty('--fs-offer', `${defaults.offer * factor}rem`);
    container.style.setProperty('--fs-name', `${defaults.name * factor}rem`);
    container.style.setProperty('--fs-category', `${defaults.category * factor}rem`);
    container.style.setProperty('--fs-detail', `${defaults.detail * factor}rem`);
    container.style.setProperty('--fs-price', `${defaults.price * factor}rem`);

    // Sync individual inputs to reflect new values?
    // Optional, but good UX.
    document.getElementById('fsOffer').value = (defaults.offer * factor).toFixed(1);
    document.getElementById('fsName').value = (defaults.name * factor).toFixed(1);
    document.getElementById('fsCategory').value = (defaults.category * factor).toFixed(1);
    document.getElementById('fsDetail').value = (defaults.detail * factor).toFixed(1);
    document.getElementById('fsPrice').value = (defaults.price * factor).toFixed(1);
}

export function setFont(fontFamily) {
    const container = document.getElementById('printContainer');
    if (container) {
        // Update both main and variable used by CSS
        container.style.setProperty('--poster-font-main', fontFamily);
    }
}

function setupListeners() {
    // ... (Previous Listeners) ...
    // Note: partial replace, I'm pasting the function content + new stuff

    // Bulk Input Listeners
    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                updateDefault(key, e.target.value);
            });
        }
    };

    bindInput('offerText', 'offer');
    bindInput('productName', 'name');
    bindInput('productCategory', 'category');
    bindInput('productDetail', 'detail');
    bindInput('productPrice', 'price');

    const unitEl = document.getElementById('productUnit');
    if (unitEl) {
        unitEl.addEventListener('change', (e) => updateDefault('unit', e.target.value));
    }

    // Config Listeners
    document.getElementById('backgroundTheme')?.addEventListener('change', (e) => updateConfig('theme', e.target.value));
    document.getElementById('paperSize')?.addEventListener('change', (e) => updateConfig('paper', e.target.value));
    document.getElementById('orientation')?.addEventListener('change', (e) => updateConfig('orientation', e.target.value));

    document.getElementById('gridLayout')?.addEventListener('change', (e) => {
        updateConfig('layout', parseInt(e.target.value));
        import('./state.js').then(m => m.resizeCardsArray());

        // Re-apply scale for new layout defaults
        const slider = document.getElementById('contentScaleSlider');
        if (slider) setGlobalScale(parseFloat(slider.value));
    });

    // New Controls: Global Scale & Font
    const scaleSlider = document.getElementById('contentScaleSlider');
    const scaleDisplay = document.getElementById('contentScaleDisplay');
    if (scaleSlider) {
        scaleSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            setGlobalScale(val);
            if (scaleDisplay) scaleDisplay.innerText = `${Math.round(val * 100)}%`;
        });
    }

    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            setFont(e.target.value);
        });
    }

    // Font Style Dropdown
    const styleSelect = document.getElementById('fontStyleSelect');
    if (styleSelect) {
        styleSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const container = document.getElementById('printContainer');

            // Map values to weight/style
            let weight = '400';
            let style = 'normal';

            switch (val) {
                case 'normal':
                    weight = '400';
                    style = 'normal';
                    break;
                case 'bold':
                    weight = '700';
                    style = 'normal';
                    break;
                case 'italic':
                    weight = '400';
                    style = 'italic';
                    break;
                case 'bold-italic':
                    weight = '700';
                    style = 'italic';
                    break;
            }

            container.style.setProperty('--poster-font-weight', weight);
            container.style.setProperty('--poster-font-style', style);
        });
    }

    // Font Style Toggles
    const btnBold = document.getElementById('btnToggleBold');
    if (btnBold) {
        btnBold.addEventListener('click', () => {
            const container = document.getElementById('printContainer');
            const currentWeight = getComputedStyle(container).getPropertyValue('--poster-font-weight').trim();
            // Toggle between 700 (Bold) and 400 (Normal)
            // Or if using standard fonts, maybe 400 is default? 
            // Let's assume default is 700. If 700, go 400. If 400, go 700.
            const newWeight = (currentWeight === '700' || currentWeight === 'bold') ? '400' : '700';
            container.style.setProperty('--poster-font-weight', newWeight);

            // Visual feedback
            btnBold.style.background = newWeight === '700' ? 'var(--accent-color)' : '';
            btnBold.style.color = newWeight === '700' ? 'white' : '';
        });
    }

    const btnItalic = document.getElementById('btnToggleItalic');
    if (btnItalic) {
        btnItalic.addEventListener('click', () => {
            const container = document.getElementById('printContainer');
            const currentStyle = getComputedStyle(container).getPropertyValue('--poster-font-style').trim();
            const newStyle = (currentStyle === 'italic') ? 'normal' : 'italic';
            container.style.setProperty('--poster-font-style', newStyle);

            // Visual feedback
            btnItalic.style.background = newStyle === 'italic' ? 'var(--accent-color)' : '';
            btnItalic.style.color = newStyle === 'italic' ? 'white' : '';
        });
    }

    // Undo/Redo
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);

    // Image Upload
    document.getElementById('bgUpload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                updateConfig('backgroundImage', evt.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Clear Background Logic
    const clearBtn = document.getElementById('clearBgBtn');
    if (clearBtn) {
        import('./state.js').then(({ state }) => {
            if (state.config.backgroundImage) clearBtn.style.display = 'block';
        });

        clearBtn.addEventListener('click', () => {
            updateConfig('backgroundImage', null);
            document.getElementById('bgUpload').value = '';
            clearBtn.style.display = 'none';
        });

        import('./state.js').then(({ subscribe }) => {
            subscribe((state) => {
                clearBtn.style.display = state.config.backgroundImage ? 'block' : 'none';
            });
        });
    }

    // PDF & Print
    document.getElementById('btnDownloadPdf')?.addEventListener('click', downloadPDF);

    setupStyleControls();
}

function setupStyleControls() {
    // ... existing ...
    const fontInputs = ['fsOffer', 'fsName', 'fsCategory', 'fsDetail', 'fsPrice'];
    const cssVars = ['--fs-offer', '--fs-name', '--fs-category', '--fs-detail', '--fs-price'];

    fontInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val) document.getElementById('printContainer').style.setProperty(cssVars[index], `${val}rem`);
                else document.getElementById('printContainer').style.removeProperty(cssVars[index]);
            });
        }
    });

    const scaleInputs = ['scaleOffer', 'scaleName', 'scaleCategory', 'scaleDetail', 'scalePrice'];
    const scaleVars = ['--scale-y-offer', '--scale-y-name', '--scale-y-category', '--scale-y-detail', '--scale-y-price'];

    scaleInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val) document.getElementById('printContainer').style.setProperty(scaleVars[index], val);
                else document.getElementById('printContainer').style.removeProperty(scaleVars[index]);
            });
        }
    });

    document.getElementById('resetFonts')?.addEventListener('click', () => {
        // Reset scale slider too
        const slider = document.getElementById('contentScaleSlider');
        if (slider) {
            slider.value = 1.0;
            const display = document.getElementById('contentScaleDisplay');
            if (display) display.innerText = '100%';
            setGlobalScale(1.0);
        }

        // Reset individual inputs (setGlobalScale handles filling them, but we clear overrides)
        // Actually setGlobalScale overwrites everything based on defaults. 
        // So just calling setGlobalScale(1.0) is mostly enough.

        scaleInputs.forEach((id, index) => {
            const input = document.getElementById(id);
            if (input) input.value = '1.0';
            document.getElementById('printContainer').style.removeProperty(scaleVars[index]);
        });
    });
}

function updatePrintSettings() {
    let existingStyle = document.getElementById('dynamic-print-style');
    if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = 'dynamic-print-style';
        document.head.appendChild(existingStyle);
    }

    const { paper, orientation } = state.config;
    existingStyle.innerHTML = `@page { size: ${paper} ${orientation}; margin: 0; }`;
}

export function renderPoster() {
    const pc = document.getElementById('printContainer');
    if (!pc) return;

    pc.className = 'print-container';
    pc.classList.add(`paper-${state.config.paper.toLowerCase()}`);
    pc.classList.add(state.config.orientation);
    pc.classList.add(`layout-${state.config.layout}`);

    pc.innerHTML = '';

    state.cards.forEach((cardData, index) => {
        pc.appendChild(createPosterCard(cardData, index));
    });

    updatePrintSettings();
    setTimeout(updatePreviewScale, 0);
}

function createPosterCard(data, index) {
    const card = document.createElement('div');
    card.className = 'poster-card';
    if (state.config.theme === 'vector') {
        card.classList.add('theme-vector');
    }

    if (state.config.backgroundImage) {
        card.style.backgroundImage = `url(${state.config.backgroundImage})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
        card.classList.remove('theme-vector');
    }

    const content = document.createElement('div');
    content.className = 'content';

    const createField = (cls, text, fieldName) => {
        const div = document.createElement('div');
        div.className = cls;
        div.innerText = text;
        setupInteraction(div, index, fieldName);
        return div;
    };

    content.appendChild(createField('offer-label', data.offer, 'offer'));
    content.appendChild(createField('product-name', data.name, 'name'));
    if (data.category) content.appendChild(createField('product-category', data.category, 'category'));
    if (data.detail) content.appendChild(createField('product-detail', data.detail, 'detail'));

    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';

    const currency = document.createElement('span');
    currency.className = 'currency';
    currency.innerText = 'R$';

    const priceVal = document.createElement('span');
    priceVal.className = 'price-value';
    priceVal.innerText = data.price;

    setupInteraction(priceVal, index, 'price');

    const unitVal = document.createElement('span');
    unitVal.className = 'unit-value';
    unitVal.style.fontSize = "0.4em";
    unitVal.innerText = data.unit ? ` /${data.unit}` : '';

    const selectContainer = (e) => {
        e.stopPropagation();
        selectElement(priceContainer);
    };

    priceVal.addEventListener('click', selectContainer);
    currency.addEventListener('click', selectContainer);
    unitVal.addEventListener('click', selectContainer);

    priceContainer.appendChild(currency);
    priceContainer.appendChild(priceVal);
    priceContainer.appendChild(unitVal);

    makeDraggable(priceContainer);

    content.appendChild(priceContainer);
    card.appendChild(content);

    return card;
}

function setupInteraction(element, dataIndex, dataField) {
    makeDraggable(element);

    element.contentEditable = false;

    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });

    element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        element.contentEditable = true;
        element.focus();
        element.classList.add('editing');
        selectElement(element);
    });

    // Mobile Double Tap Support
    let lastTap = 0;
    element.addEventListener('touchend', (e) => {
        // Allow default behavior if already editing (so cursor placement works)
        if (element.contentEditable === 'true') return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault(); // Prevent potential zoom or other double-tap browser actions
            // Force edit mode
            element.contentEditable = true;
            element.focus();
            element.click(); // Dispatch click to ensure selection logic runs
            element.classList.add('editing');
            selectElement(element);
        }
        lastTap = currentTime;
    });

    element.addEventListener('blur', () => {
        element.contentEditable = false;
        element.classList.remove('editing');
        updateCard(dataIndex, dataField, element.innerText);
    });
}

export async function downloadPDF() {
    const element = document.getElementById('printContainer');
    const btn = document.getElementById('btnDownloadPdf');

    const originalText = btn.innerText;
    btn.innerText = "GERANDO...";
    btn.disabled = true;

    const originalTransform = element.style.transform;
    element.style.transform = 'none';
    element.style.margin = '0';
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    const opt = {
        margin: 0,
        filename: `cartazista-${state.config.paper}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: state.config.paper.toLowerCase(), orientation: state.config.orientation }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error(err);
        alert('Erro ao gerar PDF');
    } finally {
        element.style.transform = originalTransform;
        element.style.boxShadow = '';
        element.style.border = '';
        btn.innerText = originalText;
        btn.disabled = false;
        updatePreviewScale();
    }
}
