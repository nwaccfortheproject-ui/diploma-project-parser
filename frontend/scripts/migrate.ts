import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Product from '../src/models/Product';

const MONGODB_URL = process.env.MONGODB_URL!;

function parsePrice(priceStr: string | null | undefined): number {
    if (!priceStr) return 0;
    const numericMap = priceStr.replace(/[^\d]/g, '');
    return parseInt(numericMap) || 0;
}

async function migrate() {
    if (!MONGODB_URL) {
        console.error("No MONGODB_URL found");
        process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to DB...");

    const filePath = path.join(__dirname, '../../products.json');
    console.log(`Reading from: ${filePath}`);
    
    let products = [];
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        products = JSON.parse(fileContent);
    } catch(e) {
        console.error("Failed to read JSON", e);
        process.exit(1);
    }

    console.log(`Found ${products.length} products to migrate`);

    const ops = products.map((p: any) => {
        return {
            insertOne: {
                document: {
                    url: p.url,
                    title: p.title,
                    brand: p.brand,
                    article: p.article,
                    composition: p.composition,
                    gender: p.gender,
                    categories: p.categories || [],
                    breadcrumbs: p.breadcrumbs || [],
                    price: p.price,
                    discount_price: p.discount_price,
                    sizes: p.sizes || [],
                    images: p.images || [],
                    description: p.description,
                    parsedPrice: parsePrice(p.discount_price || p.price),
                }
            }
        };
    });

    console.log("Clearing existing products...");
    await Product.deleteMany({});
    
    console.log("Inserting products in chunks...");
    const chunkSize = 1000;
    let inserted = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
        const chunk = ops.slice(i, i + chunkSize);
        try {
            await Product.bulkWrite(chunk);
            inserted += chunk.length;
            console.log(`Inserted ${inserted}/${ops.length}`);
        } catch(e) {
            console.error(`Error inserting chunk at index ${i}`, e);
        }
    }

    console.log("Migration finished.");
    process.exit(0);
}

migrate();
