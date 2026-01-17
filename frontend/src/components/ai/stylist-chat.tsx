'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { X, Send, Maximize2, Minimize2, Sparkles, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './chat-message';
import { VirtualTryOn } from './virtual-try-on';
import { useStylist } from '@/context/style-context';
import { Progress } from "@/components/ui/progress";

export function StylistChat() {

    // Consume Context
    const {
        isChatOpen, toggleChat, openChat,
        isTryOnOpen, currentTryOnProduct, openTryOn: contextOpenTryOn, closeTryOn,
        lastGeneratedImage, setLastGeneratedImage,
        isGenerating, generationProgress
    } = useStylist();

    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [input, setInput] = useState('');

    // @ai-sdk/react v3 compatibility
    const { messages, status, append, setMessages } = useChat({
        // api: '/api/chat', // Default
    }) as any;

    const isLoading = status === 'submitted' || status === 'streaming';

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Listen for new generated images and add to chat
    useEffect(() => {
        if (lastGeneratedImage) {

            const newMessage: any = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Вот как вы выглядите в ${currentTryOnProduct?.title || 'item'}!\n\n:::IMAGE_DATA:::${lastGeneratedImage}`,
                createdAt: new Date(),
            };

            setMessages((prev: any[]) => [...prev, newMessage]);

            // Clear it so we don't duplicate
            setLastGeneratedImage(null);
            openChat(); // Ensure chat is visible
        }
    }, [lastGeneratedImage, setMessages, currentTryOnProduct, openChat, setLastGeneratedImage]);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput(''); // Clear input immediately

        await append({
            role: 'user',
            content: userMessage,
        });
    };

    // Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
        if (!isChatOpen) toggleChat(); // Auto-open on drag hover
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        try {
            const productData = e.dataTransfer.getData('application/json');
            if (productData) {
                const product = JSON.parse(productData);
                // Send a user message contextually
                append({ role: 'user', content: `Меня интересует этот товар: ${product.title} (Бренд: ${product.brand}). Что вы думаете о нем?` });
            }
        } catch (err) {
            console.error("Failed to parse dropped product", err);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            width: isExpanded ? '90vw' : 'min(400px, calc(100vw - 40px))',
                            height: isExpanded ? '90vh' : '600px',
                            right: isExpanded ? '5vw' : '20px',
                            bottom: isExpanded ? '5vh' : '80px',
                        }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed z-50 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col font-sans"
                        style={{
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-pointer"
                            onDoubleClick={toggleExpand}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                <h3 className="font-semibold">AI Стилист</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={toggleExpand} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>
                                <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-hidden relative bg-gray-50/50">
                            <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 mt-10">
                                        <Shirt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">Привет! Я ваш персональный AI стилист.</p>
                                        <p className="text-xs mt-1">Спросите меня об идеях для наряда, сочетаниях или нажмите "Примерить" на товаре!</p>
                                    </div>
                                )}

                                {messages.map((m: any) => (
                                    <ChatMessage key={m.id} message={m} onTryOn={contextOpenTryOn} />
                                ))}

                                {/* Generation Progress Indicator */}
                                {isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-blue-100 rounded-xl p-3 shadow-md mx-4 mb-2"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                            <span className="text-sm font-medium text-blue-700">Создаю ваш образ...</span>
                                            <span className="text-xs text-blue-400 ml-auto">{generationProgress}%</span>
                                        </div>
                                        <Progress value={generationProgress} className="h-1.5" />
                                    </motion.div>
                                )}

                                {isLoading && !isGenerating && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-200 rounded-2xl rounded-tl-none py-2 px-4">
                                            <span className="flex gap-1">
                                                <span className="animate-bounce">.</span>
                                                <span className="animate-bounce delay-100">.</span>
                                                <span className="animate-bounce delay-200">.</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={onSubmit} className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Спросите совет..."
                                    className="flex-1"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !input?.trim()}
                                    title={isLoading ? "AI думает..." : (!input?.trim() ? "Введите сообщение" : "Отправить")}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <VirtualTryOn
                open={isTryOnOpen}
                onOpenChange={(val: any) => val ? null : closeTryOn()} // Only handle close from here
                product={currentTryOnProduct || undefined}
            />

            {/* Toggle Button (Floating FAB) */}
            {!isChatOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleChat}
                    className="fixed z-50 bottom-10 right-10 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white cursor-pointer"
                >
                    <Sparkles className="h-8 w-8" />
                </motion.button>
            )}
        </>
    );
}
