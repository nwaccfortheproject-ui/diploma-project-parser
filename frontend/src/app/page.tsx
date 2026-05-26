import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { AIFeatureSection } from '@/components/home/ai-feature-section';
import { UserMenu } from '@/components/auth/user-menu';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">

      {/* Navbar Placeholder (Ideally this would be a real component) */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="SMARTBUY">
            <Logo size={48} priority />
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/products" className="hover:text-blue-600 transition-colors">Мужское</Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">Женское</Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">Аксессуары</Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">Распродажа</Link>
          </nav>
          <div className="flex gap-4 items-center">
            <UserMenu />
            <Link href="/products">
              <Button>Купить сейчас</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[800px] flex items-center justify-center overflow-hidden bg-gray-900 text-white">
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute w-full h-full object-cover opacity-60"
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          </div>

          <div className="container relative z-10 px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium backdrop-blur-sm animate-fade-in-up">
              <Star className="h-3 w-3" /> Новая коллекция Весна 2026
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight animate-fade-in-up delay-100">
              Подними свой <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Стиль.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up delay-200">
              Откройте для себя премиальную моду от лучших мировых брендов. Избранные коллекции для современной эстетики.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up delay-300">
              <Link href="/products">
                <Button size="lg" className="h-12 px-8 text-base rounded-full bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Начать покупки <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products?category=Sale">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white hover:text-gray-900 hover:border-white transition-all duration-300">
                  Смотреть скидки
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Benefits */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Премиум Бренды</h3>
                <p className="text-gray-500">Доступ к более чем 100 эксклюзивным брендам напрямую из Европы.</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Последние Тренды</h3>
                <p className="text-gray-500">Будьте впереди с ежедневными обновлениями модных новинок.</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Подлинное Качество</h3>
                <p className="text-gray-500">Гарантия 100% оригинальности продукции, проверенной нашими экспертами.</p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <AIFeatureSection />

        {/* Simple Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2026 SMARTBUY. All rights reserved.</p>
          </div>
        </footer>

      </main>
    </div>
  );
}
