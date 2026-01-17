import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useStylist } from '@/context/style-context';
import { Progress } from "@/components/ui/progress";

interface VirtualTryOnProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    product?: {
        title: string;
        brand: string;
        description?: string;
    };
}

export function VirtualTryOn({ open, onOpenChange, product }: VirtualTryOnProps) {
    const { startTryOnProcess } = useStylist();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Trigger handled externally or hidden */}
            <DialogContent
                className="sm:max-w-[425px]"
                onInteractOutside={(e) => {
                    if (isProcessing) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isProcessing) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Виртуальная Примерка (Beta)</DialogTitle>
                    <DialogDescription>
                        Загрузите фото в полный рост, чтобы примерить одежду виртуально.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 relative">
                    {previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[3/4]">
                            <img src={previewUrl} alt="User upload" className="w-full h-full object-cover" />

                            <button
                                onClick={() => {
                                    if (isProcessing) return;
                                    setSelectedFile(null); setPreviewUrl(null);
                                }}
                                disabled={isProcessing}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg transition-colors relative ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                            <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={handleFileChange}
                                disabled={isProcessing}
                            />
                            <Upload className="h-10 w-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Нажмите для загрузки фото</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        disabled={!selectedFile || isProcessing}
                        onClick={async () => {
                            if (!selectedFile || isProcessing) return;

                            setIsProcessing(true);

                            try {
                                const reader = new FileReader();
                                reader.readAsDataURL(selectedFile);
                                reader.onload = async () => {
                                    const base64Image = reader.result;
                                    const productPayload = product || {
                                        title: "Stylish Summer Dress",
                                        brand: "Gucci",
                                        description: "A floral red summer dress"
                                    };

                                    // Delegate to Context
                                    // This will close the modal and open chat immediately
                                    await startTryOnProcess(base64Image as string, productPayload);
                                };
                            } catch (error) {
                                console.error(error);
                                alert("Error starting try-on");
                                setIsProcessing(false);
                            }
                        }}
                    >
                        {isProcessing ? "Запуск..." : (selectedFile ? "Спросить Стилиста / Примерить" : "Сначала выберите фото")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

