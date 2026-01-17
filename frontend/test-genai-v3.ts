import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
    console.log("Initializing Gemini 3 Pro Test...");
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("No API KEY found");
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey });

    const userImagePath = path.join(process.cwd(), "public", "Photo.jpg");
    const productImagePath = path.join(process.cwd(), "public", "product-sample.jpg");

    if (!fs.existsSync(userImagePath) || !fs.existsSync(productImagePath)) {
        console.error("Missing test images at public/Photo.jpg or public/product-sample.jpg");
        process.exit(1);
    }

    const userImageBase64 = fs.readFileSync(userImagePath).toString("base64");
    const productImageBase64 = fs.readFileSync(productImagePath).toString("base64");

    // The Prompt specifically requested by User
    const promptText = `Вот фото как выглядит автор, фото приложено. Так же приложено фото товара и наименование товара, запоминая как выглядит товар, надень ее на автора, не меняя ничего на его кадре кроме его одежды. Наименование товара: Sample Red Hoodie.`;

    const contents = [
        { text: promptText },
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: userImageBase64,
            },
        },
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: productImageBase64,
            },
        }
    ];

    console.log("Sending request to gemini-3.0-pro-image-preview...");
    // Note: User said 'gemini-3-pro-image-preview'. Double check if 3.0 or 3.
    // Official docs usually say 'gemini-2.0-flash-exp' or similar. 
    // We will try 'gemini-2.0-flash-exp' if 3 fails, but the user insists on 3.
    // Let's try "gemini-3-pro-image-preview" as written. NOTE: It might not exist yet publicly or be "gemini-2.0-flash-exp" (which is the V2 preview).
    // BUT the user provided documentation link for "Gemini 3 Pro Image" saying it exists.
    // I will try it.

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: contents,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            }
        });

        console.log("Response Received keys:", Object.keys(response || {}));

        const candidates = response.candidates || (response as any).response?.candidates;

        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.text) {
                    console.log("Text Response:", part.text);
                }
                if (part.inlineData) {
                    const buffer = Buffer.from(part.inlineData.data, "base64");
                    fs.writeFileSync("public/gemini-v3-result.png", buffer);
                    console.log("SUCCESS: Saved public/gemini-v3-result.png");
                }
            }
        } else {
            console.log("No candidates found.", JSON.stringify(response, null, 2));
        }

    } catch (error: any) {
        console.error("Generation Failed:", error.message);
        console.log("Trying fallback model: gemini-2.0-flash-exp in case v3 is invalid name...");
        // Fallback attempt just in case name is wrong
        try {
            const responseFallback = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: contents,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                }
            });
            console.log("Fallback Response Received keys:", Object.keys(responseFallback || {}));
            const candidates = responseFallback.candidates || (responseFallback as any).response?.candidates;
            if (candidates && candidates[0]?.content?.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        const buffer = Buffer.from(part.inlineData.data, "base64");
                        fs.writeFileSync("public/gemini-v2-fallback.png", buffer);
                        console.log("SUCCESS (Fallback): Saved public/gemini-v2-fallback.png");
                    }
                }
            }

        } catch (fbError: any) {
            console.error("Fallback Failed too:", fbError.message);
        }
    }
}

main();
