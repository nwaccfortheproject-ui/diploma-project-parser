import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env");
        process.exit(1);
    }

    console.log("Initializing Gemini Client...");
    const ai = new GoogleGenAI({ apiKey });

    // Use the public/Photo.jpg 
    const imagePath = path.join(process.cwd(), "public", "Photo.jpg");

    if (!fs.existsSync(imagePath)) {
        console.error(`Image not found at ${imagePath}. Please add 'Photo.jpg' to public folder.`);
        process.exit(1);
    }

    console.log(`Reading image from ${imagePath}...`);
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString("base64");

    // Simulate the prompt used in our API
    // We want to try on a specific item. Let's assume a "Red Hoodie" for the test.
    const prompt = [
        { text: "Generate a photorealistic image of this person wearing a stylish red hoodie with the brand 'Under Armour'. Maintain the person's pose and facial features. High quality, 4k." },
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
            },
        },
    ];

    console.log("Generating content with model: gemini-2.5-flash-image");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            }
        });

        console.log("Response received. Keys:", Object.keys(response || {}));

        let imageSaved = false;

        // Handle new SDK response structure
        // Usually response.response.candidates or response.candidates depending on version/method
        // We check widely.
        const candidates = response.candidates || (response as any).response?.candidates;

        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.text) {
                    console.log("Text response:", part.text);
                }

                if (part.inlineData) {
                    const imageData = part.inlineData.data;
                    const buffer = Buffer.from(imageData, "base64");
                    const outputPath = path.join(process.cwd(), "public", "try-on-result.png");
                    fs.writeFileSync(outputPath, buffer);
                    console.log(`SUCCESS: Image saved to ${outputPath}`);
                    imageSaved = true;
                }
            }
        }

        if (!imageSaved) {
            console.log("No image data found in response.");
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error("Generation failed:", error);
    }
}

main();
