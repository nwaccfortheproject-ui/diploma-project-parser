import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, WifiOff } from 'lucide-react';

export const metadata = {
    title: 'Нет соединения — SMARTBUY',
    description: 'Похоже, вы не в сети. Мы вернёмся, как только связь восстановится.',
};

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-6 text-center">
            <div className="max-w-md space-y-6">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.35)]">
                    <ShoppingBag className="h-10 w-10" />
                </div>

                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                        <WifiOff className="h-4 w-4" /> Нет интернета
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Связь потеряна</h1>
                    <p className="text-gray-400">
                        Каталог и AI-стилист требуют подключения. Проверьте сеть и попробуйте снова.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8 bg-white text-gray-900 hover:bg-gray-100">
                            На главную
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
