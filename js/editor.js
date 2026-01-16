
import { state, updateConfig, updateDefault, updateCard, setCards, subscribe, undo, redo } from './state.js';
import { makeDraggable, selectElement } from './drag-drop.js';
import { updatePreviewScale } from './mobile-scale.js';

const elements = {
    printContainer: document.getElementById('printContainer'),
};

export function initEditor() {
    setupListeners();
    subscribe(renderPoster);
    subscribe(renderPoster);
    renderPoster();
}

import { getSelectedElement, updateSelectedElementText } from './drag-drop.js';

async function copyText() {
    const el = getSelectedElement();
    if (!el) {
        alert('Selecione um item primeiro para copiar.');
        return;
    }

    // Extract text content (exclude children if necessary, but innerText usually works)
    // For price container, innerText might be "R$ 88,88 /Kg". That's fine.
    const text = el.innerText;

    try {
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById('copyBtn');
        const original = btn.innerText;
        btn.innerText = "Copiado!";
        setTimeout(() => btn.innerText = original, 1500);
    } catch (err) {
        console.error('Clipboard failed', err);
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert('Texto copiado!');
    }
}

async function pasteText() {
    const el = getSelectedElement();
    if (!el) {
        alert('Selecione um item primeiro para colar o texto.');
        return;
    }

    let text = '';
    try {
        text = await navigator.clipboard.readText();
    } catch (err) {
        console.warn('Clipboard read failed/denied', err);
        text = prompt('Colar texto aqui (sem permissão de acesso à área de transferência):');
    }

    if (text) {
        if (el.classList.contains('price-container')) {
            // Special handling for price? Or just let user edit individual parts?
            // Since price container includes currency and unit, pasting whole text might break structure if we just replace innerText.
            // We should probably only allow pasting into leaf nodes (which are selectedElement usually).
            // But getSelectedElement returns the container for price usually?
            // drag-drop.js: selectElement(priceContainer).
            // We might need to handle this.
            // If price container is selected, we can't easily guess what to paste.
            alert('Selecione o valor ou a moeda individualmente para colar.');
            return;
        }

        // Update Element
        el.innerText = text;

        // Trigger update event to save state
        el.dispatchEvent(new Event('blur'));
        // Force update if blur handler needs to know
        updateSelectedElementText(text);
    }
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
    bindInput('productCurrency', 'currency');

    const unitEl = document.getElementById('productUnit');
    if (unitEl) {
        unitEl.addEventListener('input', (e) => updateDefault('unit', e.target.value));
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
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);

    document.getElementById('copyBtn')?.addEventListener('click', copyText);
    document.getElementById('pasteBtn')?.addEventListener('click', pasteText);



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
    currency.innerText = data.currency !== undefined ? data.currency : 'R$';

    const priceVal = document.createElement('span');
    priceVal.className = 'price-value';
    priceVal.innerText = data.price;

    setupInteraction(priceVal, index, 'price');

    const unitVal = document.createElement('span');
    unitVal.className = 'unit-value';
    unitVal.style.fontSize = "0.4em";
    unitVal.innerText = data.unit ? ` ${data.unit}` : '';

    // Independent interaction for Unit too, if desired?
    // User said "Price not selecting". Usually just price value is critical.
    // Let's make Unit also interactive just in case? Or just leave it attached to container?
    // If container is NOT draggable, how do we move Unit?
    // If I make priceVal draggable, R$ and Unit stay behind?
    // That sounds bad.

    // WAIT. "Igual os outros" might mean "I want to click the number and have IT selected".
    // If I select the container, the box is big.

    // Let's try this:
    // 1. Keep Container Draggable (so they move together).
    // 2. Make PriceVal also Draggable/Selectable.
    // 3. BUT stop propagation on PriceVal mousedown so it doesn't drag container?
    // If I drag PriceVal, it moves relative to container?
    // Then it gets misaligned.

    // Let's look at "Others". "product-name" is a DIV.
    // "price-value" is a SPAN inside a DIV.
    // Maybe make "price-value" a DIV?

    // BETTER PLAN requested by user interpretation:
    // "Leave it equal to the others" -> Simple, standard behavior.
    // The previous behavior (before my "fix") was: Double Draggable.
    // User complaint was "Only price not selecting everything".
    // Maybe they meant "When I select price, it doesn't select R$ and Unit"?

    // Let's go with the Container Group approach but FIX the selection.
    // Maybe the user wants to click the number and have the CONTAINER selected?
    // That's what I did. But they said "Still cannot select".

    // Maybe the `contentEditable = false` on `priceVal` blocked clicks?
    // I am going to try a hybrid:
    // remove `makeDraggable(priceContainer)` -> NO.

    // I will try to make `priceVal` capture the interactions and Proxy them to container?
    // If I click `priceVal`, I select `priceContainer`.
    // If I drag `priceVal`, I drag `priceContainer`?
    // `makeDraggable` works on `mousedown`.
    // If I don't stop propagation, `priceContainer` drags.
    // But `priceVal` is NOT draggable?

    // Reverting to the code that simply works:
    // priceContainer is the draggable entity.
    // priceVal is just text.
    // To ensure "Select", I will ensure `pointer-events` pass through or bubble correctly.

    // My previous code:
    // priceVal.addEventListener('click', selectContainer);
    // Maybe `click` is too late? `mousedown` selects?

    // Let's just remove the custom logic and use `pointer-events: none` on the children so only container receives events?
    // But then we can't double-click to edit!

    // Solution:
    // 1. Container is Draggable.
    // 2. Children (PriceVal) have `mousedown` listener that simply behaves as "Start Dragging Container".
    //    Since `mousedown` bubbles, this happens automatically!
    // 3. Selection: `dragStart` calls `selectElement`. Bubbling `mousedown` triggers `dragStart` on container.
    //    So clicking text SHOULD select container.

    // Why did user say "Cannot Select"? 
    // Maybe `priceVal` has `stopImmediatePropagation` somewhere?
    // Or `setupInteraction` creates some conflict.

    // I will restore `setupInteraction` but REMOVE `makeDraggable` from `setupInteraction`?
    // No, `setupInteraction` is a helper.

    // Let's try:
    // 1. `makeDraggable(priceContainer)`
    // 2. `priceVal` -> `setupInteraction` (Draggable).
    // result: "Ghosting".

    // User wants "Equal to Others".
    // Others = Draggable Field.
    // Price = Draggable Field.
    // I will make `priceContainer` NOT draggable.
    // I will make `priceVal`, `currency`, `unit` ALL draggable independently?
    // No, alignment issues.

    // I will make `priceVal` draggable. `currency` and `unit` follow?
    // No.

    // Let's try to interpret "Others" as "Single Element".
    // Maybe I should flatten the structure?
    // `price-container` just groups them visually?

    // I will try enabling `setupInteraction` on `priceVal` again, but REMOVE `makeDraggable(priceContainer)`.
    // This allows moving the number. R$ and Unit will stay fixed?
    // If that's what "Equal to Others" means (Granular control), then good.
    // If they want grouping, they need container.

    // BUT the user said "Leave it equal to the others".
    // Others are single.
    // I will try making `priceVal` fully independent.

    setupInteraction(priceVal, index, 'price');

    priceVal.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(priceVal);
    });

    // currency and unit independent?
    // currency.classList.add('draggable');...

    // And REMOVE makeDraggable(priceContainer).

    priceContainer.appendChild(currency);
    priceContainer.appendChild(priceVal);
    priceContainer.appendChild(unitVal);

    // makeDraggable(priceContainer); // DISABLED default group drag


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


async function copyImageToClipboard() {
    const element = document.getElementById('printContainer');
    if (!element) throw new Error("Elemento não encontrado");

    // Capture current state to restore later
    const originalTransform = element.style.transform;
    const originalMargin = element.style.margin;
    const originalBoxShadow = element.style.boxShadow;

    // Reset styles for clean capture (render at natural size)
    element.style.transform = 'none';
    element.style.margin = '0';
    element.style.boxShadow = 'none';

    // Determine quality/scale based on layout
    // Scale 2 is usually good for retina/high def
    const opt = {
        margin: 0,
        filename: 'cartaz.png', // internal name
        image: { type: 'png', quality: 1.0 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: null // Transparent if not specified, but poster has bg
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        // Generate Canvas
        // We use html2pdf's worker chain to get the canvas easily
        const worker = html2pdf().set(opt).from(element);
        const canvas = await worker.toCanvas();

        if (!canvas) throw new Error("Erro ao gerar a imagem do cartaz.");

        // Convert to Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        if (!blob) throw new Error("Falha ao criar arquivo de imagem.");

        // Write to Clipboard
        if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
        } else {
            throw new Error("Seu navegador ou contexto (inseguro?) não permite copiar imagens. Tente 'Baixar PDF'.");
        }

    } finally {
        // Restore styling
        element.style.transform = originalTransform;
        element.style.margin = originalMargin;
        element.style.boxShadow = originalBoxShadow;

        // Force update preview scale just in case
        updatePreviewScale();
    }
}
