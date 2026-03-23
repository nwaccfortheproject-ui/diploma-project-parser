// import { type Message } from 'ai'; 
// import { type UIToolInvocation } from 'ai';
import { cn } from '@/lib/utils';
import { User, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ProductRecommendation {
    id: string;
    title: string;
    brand: string;
    price: number;
    image: string;
    link: string;
    reason: string;
}

export function ChatMessage({ message, onTryOn }: { message: any, onTryOn?: (product: ProductRecommendation) => void }) {
    const isUser = message.role === 'user';

    // Check for tool invocations (our product recommendations)
    const toolInvocations = message.toolInvocations;

    return (
        <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isUser ? "bg-gray-200 text-gray-600" : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
            )}>
                {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>

            <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm overflow-hidden",
                isUser ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
            )}>
                {message.content && (
                    <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                        {message.content.includes(':::IMAGE_DATA:::') ? (
                            (() => {
                                const parts = message.content.split(':::IMAGE_DATA:::');
                                const textPart = parts[0];
                                const imagePart = parts[1]?.trim();
                                return (
                                    <>
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p {...props} className="m-0" />
                                            }}
                                        >
                                            {textPart}
                                        </ReactMarkdown>
                                        {imagePart && (
                                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 group relative">
                                                <img src={imagePart} alt="Generated Try-On" className="w-full h-auto object-cover" />
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a 
                                                        href={imagePart} 
                                                        download="smartbuy-tryon.jpg" 
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-white/90 backdrop-blur-sm text-gray-800 p-2 rounded-lg shadow-sm flex items-center gap-1.5 text-xs font-medium hover:bg-white"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                        Скачать
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()
                        ) : (
                            <ReactMarkdown
                                components={{
                                    img: ({ node, ...props }) => (
                                        <img {...props} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />
                                    ),
                                    p: ({ node, ...props }) => <p {...props} className="m-0" />
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}

                {/* Render Tool Results (Product Cards) */}
                {toolInvocations?.map((toolInvocation: any) => {
                    const { toolName, toolCallId, args } = toolInvocation;

                    if (toolName === 'recommendProduct') {
                        return (
                            <div key={toolCallId} className="mt-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Recommended for you:</div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x p-1">
                                    {args.products?.map((p: ProductRecommendation, idx: number) => (
                                        <div key={idx} className="min-w-[160px] max-w-[160px] bg-white border border-gray-200 rounded-xl p-3 snap-center flex-shrink-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                            <Link href={p.link || '#'} target="_blank" className="block flex-1">
                                                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>
                                                    )}
                                                    {p.price && (
                                                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                            {new Intl.NumberFormat('ru-RU').format(p.price)} ₸
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="font-semibold truncate text-xs text-gray-900">{p.title || p.id}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{p.brand}</div>
                                            </Link>

                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => onTryOn?.(p)}
                                                    className="w-full bg-blue-50 text-blue-600 text-xs py-1.5 rounded-md font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    Try On
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
