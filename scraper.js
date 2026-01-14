const { Builder, By, until, Capabilities } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL_TEMPLATE = 'https://frgroup.kz/discounts/product/695b9bcb4f9c3?page=';
const LINKS_FILE = 'links.json';
const OUTPUT_FILE = 'products.json';
const START_PAGE = 1;
const END_PAGE = process.env.END_PAGE ? parseInt(process.env.END_PAGE) : 402;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : Infinity;
const CONCURRENCY = 1; // Keep 1 to be polite and avoid blocks

// Utility: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupDriver() {
    const caps = Capabilities.chrome();
    caps.setPageLoadStrategy('eager'); // Don't wait for all images to load, just HTML
    const driver = await new Builder().forBrowser('chrome').withCapabilities(caps).build();
    return driver;
}

// ==========================================
// PHASE 1: LINK COLLECTION
// ==========================================
async function collectLinks() {
    console.log('--- STARTING PHASE 1: LINK COLLECTION ---');
    let driver = await setupDriver();
    let allLinks = new Set();

    // Load existing links if any
    if (fs.existsSync(LINKS_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
            existing.forEach(l => allLinks.add(l));
            console.log(`Loaded ${existing.length} existing links.`);
        } catch (e) { console.error('Error reading links file, starting fresh.'); }
    }

    try {
        for (let page = START_PAGE; page <= END_PAGE; page++) {
            const url = `${BASE_URL_TEMPLATE}${page}`;
            console.log(`Scraping Page ${page}/${END_PAGE}: ${url}`);

            try {
                await driver.get(url);
                await driver.wait(until.elementLocated(By.css('.products-item__link')), 10000);

                const elements = await driver.findElements(By.css('.products-item__link'));
                const links = await Promise.all(elements.map(e => e.getAttribute('href')));

                const initialCount = allLinks.size;
                links.forEach(l => {
                    if (l) allLinks.add(l);
                });

                const newCount = allLinks.size - initialCount;
                console.log(`  -> Found ${links.length} links (${newCount} new). Total unique: ${allLinks.size}`);

                // Save incrementally
                fs.writeFileSync(LINKS_FILE, JSON.stringify([...allLinks], null, 2));

            } catch (e) {
                console.error(`  Error scraping page ${page}:`, e.message);
                // Continue to next page
            }
        }
    } finally {
        await driver.quit();
    }
    console.log('--- PHASE 1 COMPLETE ---');
}

// ==========================================
// PHASE 2: DETAIL EXTRACTION
// ==========================================
async function scrapeDetails() {
    console.log('--- STARTING PHASE 2: DETAIL EXTRACTION ---');

    // 1. Load Links
    if (!fs.existsSync(LINKS_FILE)) {
        console.error('No links.json found. Run Phase 1 first.');
        return;
    }
    const allLinks = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
    console.log(`Total links to process: ${allLinks.length}`);

    // 2. Load Existing Products ( Resume capability )
    let products = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            products = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            console.log(`Loaded ${products.length} existing products. skipping them.`);
        } catch (e) { }
    }

    const scrapedUrls = new Set(products.map(p => p.url));
    let linksToScrape = allLinks.filter(url => !scrapedUrls.has(url));

    if (LIMIT && LIMIT < linksToScrape.length) {
        console.log(`Applying LIMIT=${LIMIT}`);
        linksToScrape = linksToScrape.slice(0, LIMIT);
    }

    console.log(`Remaining to scrape: ${linksToScrape.length}`);

    if (linksToScrape.length === 0) {
        console.log('All links already scraped!');
        return;
    }

    let driver = await setupDriver();

    try {
        for (let i = 0; i < linksToScrape.length; i++) {
            // Driver Rotation to avoid blocking
            if (i > 0 && i % 50 === 0) {
                console.log(`\n--- Rotating Driver (processed ${i} items) ---`);
                try {
                    await driver.quit();
                } catch (e) { /* ignore quit error */ }

                await sleep(5000); // Cool down
                driver = await setupDriver();
                console.log('--- Driver Restarted ---\n');
            }

            const url = linksToScrape[i];
            console.log(`[${i + 1}/${linksToScrape.length}] Scraping: ${url}`);

            try {
                const product = await scrapeSingleProduct(driver, url);
                products.push(product);

                // Save every 5 items
                if (products.length % 5 === 0) {
                    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
                    console.log('  (Saved progress)');
                }

                // Variable Delay based on attempts
                // If it took more than 1 attempt (retries happened), wait longer (2s)
                let delay = 1000;
                if (product._attempts && product._attempts > 1) {
                    delay = 1000;
                    console.log(`  (Recovered after ${product._attempts} attempts. Waiting 2s...)`);
                }

                // Cleanup internal property
                delete product._attempts;

                await sleep(delay);

            } catch (err) {
                console.error(`  Failed to scrape ${url}:`, err.message);
            }
        }
    } finally {
        // Final Save
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
        await driver.quit();
    }
    console.log('--- PHASE 2 COMPLETE ---');
}

async function scrapeSingleProduct(driver, url) {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 1) {
            const delay = attempt === 2 ? 3000 : 5000;
            console.log(`  [Attempt ${attempt}/${MAX_RETRIES}] Retrying ${url} (waiting ${delay / 1000}s)...`);
            await sleep(delay);
        }

        try {
            await driver.get(url);

            // Wait for main content
            try {
                await driver.wait(until.elementLocated(By.css('.product-info, h1')), 10000);
            } catch (e) { /* ignore timeout */ }

            const product = {
                url: url,
                title: null,
                brand: null,
                article: null,
                composition: null,
                gender: null,
                categories: [],
                breadcrumbs: [], // New field
                price: null,
                discount_price: null,
                sizes: [],
                images: [],
                description: {}
            };

            // 1. Title
            try {
                const titleEl = await driver.findElement(By.css('.product-info h1, .product_info_title, h1'));
                product.title = await titleEl.getText();
            } catch (e) { /* warn */ }

            // RETRY CONDITION
            if (!product.title) {
                if (attempt < MAX_RETRIES) continue;
                console.warn(`  Failed to get Title for ${url} after ${MAX_RETRIES} attempts.`);
            }

            // 2. Brand
            try {
                const brandEl = await driver.findElement(By.css('.schema-breadcrumbs__item:nth-last-child(2) a span'));
                product.brand = await brandEl.getText();
            } catch (e) {
                try {
                    const brandEl = await driver.findElement(By.css('.product_info-wrap a[href*="/store/"]'));
                    product.brand = await brandEl.getText();
                } catch (err) { /* ignore */ }
            }

            // 3. Article
            try {
                const articleEl = await driver.findElement(By.css('.product-article'));
                product.article = await articleEl.getText();
            } catch (e) { /* ignore */ }

            // 4. Price
            try {
                const discPriceEls = await driver.findElements(By.css('.product-price .current-price, .product-detail-price-new, .price_current'));
                if (discPriceEls.length > 0) product.discount_price = await discPriceEls[0].getText();

                const origPriceEls = await driver.findElements(By.css('.product-price .old-price, .product-detail-price-old, .old_price'));
                if (origPriceEls.length > 0) product.price = await origPriceEls[0].getText();

                if (!product.price && product.discount_price) {
                    product.price = product.discount_price;
                    product.discount_price = null;
                }
            } catch (e) { /* ignore */ }

            // 5. Images (FIXED: Lazy Loading support)
            try {
                const imgEls = await driver.findElements(By.css('.product_image_slide img, .product-images img, .product_images_list img, img.product-img, img.zoom-img'));
                for (let el of imgEls) {
                    let src = await el.getAttribute('data-src');
                    if (!src) src = await el.getAttribute('src');

                    if (src && !src.includes('loader') && !src.includes('svg')) {
                        product.images.push(src);
                    }
                }
                product.images = [...new Set(product.images)];
            } catch (e) { /* ignore */ }

            // 6. Sizes
            try {
                const sizeEls = await driver.findElements(By.css('.product_size_button, .size_list .size_item'));
                for (let el of sizeEls) {
                    const classes = await el.getAttribute('class');
                    if (!classes.includes('disabled')) {
                        const sizeText = await el.getText();
                        if (sizeText) product.sizes.push(sizeText.trim());
                    }
                }
            } catch (e) { /* ignore */ }

            // 7. Description & Composition
            try {
                const descEl = await driver.findElement(By.css('.product_info_bottom, .product-detail-info'));
                const text = await descEl.getText();
                const lines = text.split('\n');
                for (let line of lines) {
                    const parts = line.split(':');
                    if (parts.length > 1) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join(':').trim();
                        if (key.toLowerCase().includes('состав')) product.composition = value;
                        if (key && value) product.description[key] = value;
                    } else if (line.trim()) {
                        product.description['details'] = (product.description['details'] || '') + line.trim() + ' ';
                    }
                }
            } catch (e) { /* ignore */ }

            // 8. Explicit Composition Check (Independent)
            if (!product.composition) {
                try {
                    const specItems = await driver.findElements(By.css('.product_spec_list.product_spec_content li'));
                    for (let item of specItems) {
                        const text = await item.getText();
                        if (text.includes('Состав:')) {
                            product.composition = text.replace('Состав:', '').trim();
                            break;
                        }
                    }
                } catch (err) { /* ignore */ }
            }

            // 9. Smart Breadcrumbs (Gender & Categories)
            try {
                // Select all breadcrumb items
                const bcItems = await driver.findElements(By.css('.breadcrumb.schema-breadcrumbs .schema-breadcrumbs__item'));

                const fullBreadcrumbs = [];
                for (let item of bcItems) {
                    try {
                        const linkEl = await item.findElement(By.css('a'));
                        const text = await linkEl.getText();
                        const href = await linkEl.getAttribute('href');
                        if (text) fullBreadcrumbs.push({ text: text.trim(), url: href });
                    } catch (e) {
                        // Sometimes the last item (active) has no link, or structure differs
                        const text = await item.getText();
                        if (text) fullBreadcrumbs.push({ text: text.trim(), url: null });
                    }
                }

                product.breadcrumbs = fullBreadcrumbs;

                // Smart Logic
                const genderKeywords = ['Мужчинам', 'Женщинам', 'Мальчикам', 'Девочкам', 'Детям', 'Unisex'];

                // 9a. Extract Gender
                for (let bc of fullBreadcrumbs) {
                    if (genderKeywords.includes(bc.text)) {
                        product.gender = bc.text;
                        break;
                    }
                }

                // 9b. Extract Categories
                // Filter out: "Главная", "Каталог", The Gender itself, The Brand, The Title (active item usually)
                const stopWords = new Set(['Главная', 'Каталог', '/']);
                if (product.gender) stopWords.add(product.gender);
                if (product.brand) stopWords.add(product.brand);

                // Also exclude the last item if it looks like the title (usually is active)
                const potentialCategories = [];
                for (let i = 0; i < fullBreadcrumbs.length; i++) {
                    const txt = fullBreadcrumbs[i].text;

                    // Skip stop words
                    if (stopWords.has(txt)) continue;

                    // Skip if it's the very last item (often the product title)
                    if (i === fullBreadcrumbs.length - 1) continue;

                    potentialCategories.push(txt);
                }

                product.categories = potentialCategories;

            } catch (e) {
                console.error(`  Breadcrumb error: ${e.message}`);
            }

            product._attempts = attempt; // Attach attempt count for caller
            return product;

        } catch (err) {
            console.error(`  Error scraping ${url} (Attempt ${attempt}):`, err.message);
            if (attempt === MAX_RETRIES) return { url: url, error: err.message };
        }
    }
}

// ==========================================
// MAIN CONTROLLER
// ==========================================
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0];

    if (mode === 'links') {
        await collectLinks();
    } else if (mode === 'details') {
        await scrapeDetails();
    } else {
        console.log('Usage:');
        console.log('  node scraper.js links    -> Run Phase 1: Collect URLs from pages');
        console.log('  node scraper.js details  -> Run Phase 2: Scrape product details from collected URLs');
    }
}

main();
