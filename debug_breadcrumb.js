const { Builder, By, until, Capabilities } = require('selenium-webdriver');

async function debugBreadcrumb(url) {
    console.log(`\n--- Debugging: ${url} ---`);
    const caps = Capabilities.chrome();
    caps.setPageLoadStrategy('eager');
    const driver = await new Builder().forBrowser('chrome').withCapabilities(caps).build();

    try {
        await driver.get(url);
        await driver.sleep(3000); // Wait for dynamic content

        // Try multiple selectors
        const selectors = [
            '.breadcrumbs',
            '.breadcrumb',
            '[class*="breadcrumb"]',
            '.product-info .category', // sometimes categories are elsewhere
            'nav[aria-label="breadcrumb"]'
        ];

        for (let sel of selectors) {
            const elements = await driver.findElements(By.css(sel));
            if (elements.length > 0) {
                console.log(`Found matches for selector: "${sel}"`);
                for (let el of elements) {
                    const html = await el.getAttribute('outerHTML');
                    console.log('HTML:', html);
                    const text = await el.getText();
                    console.log('Text:', text);
                }
            } else {
                console.log(`No matches for: "${sel}"`);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await driver.quit();
    }
}

(async () => {
    await debugBreadcrumb('https://frgroup.kz/store/kurtka-zimnaa-ua-sportswear-puff-jkt-under-armour-6006360-003-chernyj');
})();
