function updatePrintSettings() {
    let existingStyle = document.getElementById('dynamic-print-style');
    if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = 'dynamic-print-style';
        document.head.appendChild(existingStyle);
    }

    const { paper, orientation } = state;

    // CSS to inject
    // @page needs to be at top level
    const css = `
        @page {
            size: ${paper} ${orientation};
            margin: 0;
        }
    `;
    existingStyle.innerHTML = css;
}
