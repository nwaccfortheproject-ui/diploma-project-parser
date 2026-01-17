import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
// In production, use process.env.GEMINI_API_KEY
// Ensure you have this key in your .env.local
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 30; // 30 seconds max duration

// --- Helper: Load Products for Context ---
// We cache this so we don't read the file on every request
let productContextCache: string | null = null;

function getProductContext() {
    if (productContextCache) return productContextCache;

    try {
        const filePath = path.join(process.cwd(), '../products.json'); // Adjust path if needed relative to where next runs

        // Fallback logic to find the file
        let finalPath = '';
        if (fs.existsSync(path.join(process.cwd(), 'products.json'))) {
            finalPath = path.join(process.cwd(), 'products.json');
        } else if (fs.existsSync(path.join(process.cwd(), '../products.json'))) {
            finalPath = path.join(process.cwd(), '../products.json');
        } else {
            console.error("Could not find products.json");
            return "No products available.";
        }

        const fileContent = fs.readFileSync(finalPath, 'utf-8');
        const allProducts = JSON.parse(fileContent);

        // Map ALL products to a minimal format to fit in context
        // We strip descriptions and other heavy fields to save space
        const minimized = allProducts.map((p: any) => ({
            id: p.id || p.article || p.url.split('/').pop(),
            title: p.title,
            brand: p.brand,
            category: Array.isArray(p.categories) ? p.categories.join(' > ') : p.categories,
            price: p.final_price || p.price,
            link: p.url,
            image: p.images?.[0] || ''
        }));

        productContextCache = JSON.stringify(minimized);
        console.log(`Loaded ${minimized.length} products into context.`);
        return productContextCache;
    } catch (error) {
        console.error("Error loading products:", error);
        return "Error loading product data. Please check available products later.";
    }
}

export async function POST(req: Request) {
    const { messages } = await req.json();

    const productContext = getProductContext();

    const systemPrompt = `
    You are an expert AI Fashion Stylist for a premium luxury boutique.
    
    Your Capabilities:
    1. Recommend specific products from our catalog based on user requests.
    2. Give styling advice (color combinations, outfit ideas).
    3. Use a helpful, sophisticated, and trendy tone.

    Here is our current Product Catalog (top 1000 items):
    ${productContext}

    Instructions:
    - When recommending products, you MUST strictly use the products listed in the catalog above.
    - If you recommend a product, use the 'recommendProduct' tool to display it as a card.
    - You can mix and match items.
    - If the user asks for something we don't have, politely suggest alternatives or explain we don't have that specific item.
    - Keep responses concise but helpful. 
    
    If the user asks to "Try On" something, ask them to upload a photo if they haven't already, or confirm you are ready to process their photo.
  `;

    try {
        const result = await streamText({
            model: google('gemini-2.0-flash-exp'),
            system: systemPrompt,
            messages,
            tools: {
                recommendProduct: tool({
                    description: 'Recommend a specific product from the catalog to the user. Use this when you want to show a product card.',
                    inputSchema: z.object({
                        products: z.array(z.object({
                            id: z.string().describe('The product ID'),
                            title: z.string().describe('The product title'),
                            brand: z.string().describe('The brand'),
                            price: z.number().describe('The price'),
                            image: z.string().describe('The image URL'),
                            link: z.string().describe('The full link to the product'),
                            reason: z.string().describe('Why this product is recommended')
                        }))
                    }),
                    execute: async (args) => {
                        // We just return the args so the client can simulate/render it
                        return args;
                    }
                }),
            },
        });

        // Check result methods for debugging
        // console.log("StreamText Result Keys:", Object.keys(result));

        // Use toTextStreamResponse as per lint suggestion for ai v6 beta
        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to process chat request' }), { status: 500 });
    }
}
