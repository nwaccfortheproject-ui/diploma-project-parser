'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our context
interface StylistContextType {
    isChatOpen: boolean;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;

    isTryOnOpen: boolean;
    currentTryOnProduct: any | null; // Product type
    openTryOn: (product: any) => void;
    closeTryOn: () => void;

    // We can add a function to inject messages into the chat for results
    lastGeneratedImage: string | null;
    setLastGeneratedImage: (img: string | null) => void;

    // Async Process
    isGenerating: boolean;
    generationProgress: number;
    startTryOnProcess: (userImageBase64: string, product: any) => Promise<void>;
}

const StylistContext = createContext<StylistContextType | undefined>(undefined);

export function StylistProvider({ children }: { children: ReactNode }) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);
    const [currentTryOnProduct, setCurrentTryOnProduct] = useState<any>(null);
    const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);

    // New State for Async Processing
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    const toggleChat = () => setIsChatOpen(prev => !prev);
    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);

    const openTryOn = (product: any) => {
        setCurrentTryOnProduct(product);
        setIsTryOnOpen(true);
    };

    const closeTryOn = () => {
        setIsTryOnOpen(false);
        // Don't clear product immediately if we are generating, but it's okay to clear currentTryOnProduct 
        // as long as startTryOnProcess captured it or we depend on it. 
        // Actually, let's keep it null safe.
    };

    const startTryOnProcess = async (userImageBase64: string, product: any) => {
        // 1. Setup UI State
        setIsGenerating(true);
        setGenerationProgress(0);
        closeTryOn(); // Close modal immediately
        openChat();   // Open chat immediately to show progress

        // 2. Simulation Interval
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 95) return 95;
                const increment = prev < 50 ? 5 : (prev < 80 ? 2 : 1);
                return prev + increment;
            });
        }, 600);

        try {
            // 3. API Call
            const response = await fetch('/api/try-on', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: userImageBase64,
                    product: product
                })
            });

            const data = await response.json();

            // 4. Cleanup & Result
            clearInterval(interval);
            setGenerationProgress(100);

            if (data.type === 'image' && data.result) {
                const imageUrl = data.result;
                setLastGeneratedImage(imageUrl);
                // Optionally handle text advice if needed
            } else if (data.error) {
                console.error("Try-On Error:", data.error);
                // Maybe set an error state to show in chat?
                // For now, we just stop. A better way would be sending a system message to chat.
            }
        } catch (err) {
            console.error("Try-On Exception:", err);
            clearInterval(interval);
        } finally {
            // Short delay to let 100% be seen? 
            // Actually, we want to stay in "Generating" until the image is pushed to chat.
            // The useEffect in StylistChat watches lastGeneratedImage and adds the message.
            // So we can turn off isGenerating AFTER setting image.
            setTimeout(() => {
                setIsGenerating(false);
            }, 500);
        }
    };

    return (
        <StylistContext.Provider value={{
            isChatOpen, toggleChat, openChat, closeChat,
            isTryOnOpen, currentTryOnProduct, openTryOn, closeTryOn,
            lastGeneratedImage, setLastGeneratedImage,
            isGenerating, generationProgress, startTryOnProcess
        }}>
            {children}
        </StylistContext.Provider>
    );
}

export function useStylist() {
    const context = useContext(StylistContext);
    if (context === undefined) {
        throw new Error('useStylist must be used within a StylistProvider');
    }
    return context;
}
