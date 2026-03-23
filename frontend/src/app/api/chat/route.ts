import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';
import Product from '@/models/Product';

// --- Configuration ---
// In production, use process.env.GEMINI_API_KEY
// Ensure you have this key in your .env.local
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 30; // 30 seconds max duration

// --- Product Context is now fetched directly inside POST ---

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    try {
        await connectToDatabase();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
            await Chat.create({
                userId: (session.user as any).id,
                role: 'user',
                content: lastMsg.content
            });
        }
    } catch(e) { console.error("Error saving user message", e); }

    let productContext = "No products loaded.";
    try {
        const topProducts = await Product.find({})
            .sort({ _id: -1 })
            .limit(1000)
            .select('article _id title brand categories parsedPrice url images')
            .lean();
            
        const minimized = topProducts.map((p: any) => ({
            id: p.article || p._id.toString(),
            title: p.title,
            brand: p.brand,
            category: Array.isArray(p.categories) ? p.categories.join(' > ') : p.categories,
            price: p.parsedPrice,
            link: p.url,
            image: p.images?.[0] || ''
        }));
        productContext = JSON.stringify(minimized);
    } catch(e) { console.error("Error loading product context", e); }

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
            async onFinish({ text, toolCalls }) {
                try {
                    await connectToDatabase();
                    let aiContent = text;
                    if (!aiContent && toolCalls?.length) {
                        aiContent = "Рекомендованы товары: " + toolCalls.map((t: any) => t.args?.products?.map((p:any) => p.title).join(', ')).filter(Boolean).join('; ');
                    }
                    if (aiContent) {
                        await Chat.create({
                            userId: (session.user as any).id,
                            role: 'assistant',
                            content: aiContent
                        });
                    }
                } catch(e) { console.error("Error saving AI message", e); }
            }
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
