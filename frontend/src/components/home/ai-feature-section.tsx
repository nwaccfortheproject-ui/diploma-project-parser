"use client";

import { motion } from "framer-motion";
import { Sparkles, Camera, Shirt, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function AIFeatureSection() {
    return (
        <section className="py-24 overflow-hidden bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-sm font-medium mb-6"
                    >
                        <Sparkles className="h-4 w-4" /> Новые AI Функции
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
                    >
                        Будущее Моды Уже Здесь.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-600"
                    >
                        Попробуйте наши революционные технологии. Примеряйте одежду виртуально и получайте советы стилиста мгновенно.
                    </motion.p>
                </div>

                {/* Feature 1: Virtual Try-On */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 blur-2xl animate-pulse"></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 aspect-[4/3] flex items-center justify-center group">
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
                                <Image
                                    src="/feature-tryon.png"
                                    alt="Визуализация виртуальной примерки"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent"></div>
                            </div>
                            {/* Decorative floating elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="absolute top-10 left-10 bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg flex items-center gap-2 border border-white/50"
                            >
                                <Shirt className="h-5 w-5 text-blue-500" />
                                <span className="text-xs font-bold text-gray-800">Платье Gucci</span>
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                                className="absolute bottom-10 right-10 bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg flex items-center gap-2 border border-white/50"
                            >
                                <span className="text-xs font-bold text-gray-800">Идеальная посадка</span>
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            <Camera className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Виртуальная Примерка</h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                            Не уверены в размере или стиле? Загрузите фото и посмотрите, как новая коллекция смотрится на ВАС. Никаких догадок, только идеальный стиль.
                        </p>
                        <ul className="space-y-3 mb-8">
                            {[
                                "Мгновенная визуализация на вашем теле",
                                "Работает с любым товаром в нашем магазине",
                                "Приватность - фото обрабатываются безопасно"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-700">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {item}
                                </li>
                            ))}
                        </ul>
                        <Link href="/products">
                            <Button size="lg" className="rounded-full">
                                Попробовать на товарах <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Feature 2: AI Stylist */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="order-2 md:order-1"
                    >
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Личный AI Стилист</h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                            Нужен совет? Наш продвинутый стилист на базе Gemini 3.0 создает полные образы, предлагает аксессуары и дает честную обратную связь.
                        </p>
                        <p className="text-gray-500 italic border-l-4 border-purple-200 pl-4 mb-8">
                            "Это как иметь профессионального консультанта в кармане 24/7."
                        </p>
                        <Button variant="outline" size="lg" className="rounded-full" onClick={() => document.dispatchEvent(new CustomEvent('open-stylist'))}>
                            Чат со Стилистом (Нажмите иконку ниже)
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative order-1 md:order-2"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-l from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-2xl animate-pulse"></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 px-6 py-8 min-h-[400px]">
                            {/* Chat Simulation */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
                                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600 max-w-[80%]">
                                        Эта куртка сочетается с черными джинсами?
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 flex-row-reverse">
                                    <div className="h-8 w-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl rounded-tr-none text-sm text-gray-800 max-w-[80%] shadow-sm">
                                        Абсолютно! Темный контраст создает стильный современный силуэт. Рекомендую добавить белые кроссовки для баланса.
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 flex-row-reverse">
                                    <div className="h-8 w-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl rounded-tr-none text-sm text-gray-800 max-w-[80%] shadow-sm">
                                        <div className="h-48 w-full bg-gray-200 rounded-lg mb-2 overflow-hidden relative group cursor-pointer">
                                            <div className="absolute inset-0 z-10 flex items-center justify-center text-white/80 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-medium backdrop-blur-sm px-2 py-1 rounded-full bg-white/20">Нажать для просмотра</span>
                                            </div>
                                            <Image
                                                src="/feature-stylist.png"
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                alt="Generated Outfit"
                                            />
                                        </div>
                                        Вот визуальное подтверждение!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
