'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart, formatKzt } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Loader2, Send } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const DELIVERY_FEE = 1990;

const KZ_CITIES = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Караганда',
    'Актобе',
    'Тараз',
    'Павлодар',
    'Усть-Каменогорск',
    'Семей',
    'Атырау',
    'Кызылорда',
    'Костанай',
    'Петропавловск',
    'Актау',
    'Уральск',
    'Темиртау',
    'Туркестан',
    'Кокшетау',
    'Талдыкорган',
] as const;

interface FormState {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    street: string;
    house: string;
    apartment: string;
    postalCode: string;
    comment: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
    cardHolder: string;
    telegramChatId: string;
}

const INITIAL_FORM: FormState = {
    fullName: '',
    phone: '+7 ',
    email: '',
    city: KZ_CITIES[0],
    street: '',
    house: '',
    apartment: '',
    postalCode: '',
    comment: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolder: '',
    telegramChatId: '',
};

function formatKzPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').replace(/^8/, '7');
    const trimmed = digits.startsWith('7') ? digits.slice(0, 11) : ('7' + digits).slice(0, 11);
    const d = trimmed.padEnd(11, ' ').slice(1);
    const p1 = d.slice(0, 3).trim();
    const p2 = d.slice(3, 6).trim();
    const p3 = d.slice(6, 8).trim();
    const p4 = d.slice(8, 10).trim();
    let out = '+7';
    if (p1) out += ` (${p1}`;
    if (p1.length === 3) out += ')';
    if (p2) out += ` ${p2}`;
    if (p3) out += `-${p3}`;
    if (p4) out += `-${p4}`;
    return out.trim();
}

function formatCardNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 2) errors.fullName = 'Введите ФИО';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
        errors.phone = 'Введите номер в формате +7 (XXX) XXX-XX-XX';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Введите email';
    if (!form.city) errors.city = 'Выберите город';
    if (form.street.trim().length < 2) errors.street = 'Укажите улицу';
    if (form.house.trim().length < 1) errors.house = 'Укажите дом';
    if (!/^\d{6}$/.test(form.postalCode)) errors.postalCode = 'Индекс — 6 цифр';

    const cardDigits = form.cardNumber.replace(/\D/g, '');
    if (cardDigits.length < 13 || cardDigits.length > 19) {
        errors.cardNumber = 'Номер карты — 13–19 цифр';
    }
    const expMatch = form.cardExpiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expMatch) {
        errors.cardExpiry = 'Формат MM/YY';
    } else {
        const mm = parseInt(expMatch[1], 10);
        if (mm < 1 || mm > 12) errors.cardExpiry = 'Месяц 01–12';
    }
    if (!/^\d{3,4}$/.test(form.cardCvc)) errors.cardCvc = 'CVC — 3–4 цифры';

    if (!/^-?\d{5,15}$/.test(form.telegramChatId.trim())) {
        errors.telegramChatId = 'Chat ID — только цифры (можно с минусом для групп)';
    }
    return errors;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalCount, totalPrice, clearCart } = useCart();
    const [hydrated, setHydrated] = useState(false);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const grandTotal = useMemo(() => totalPrice + DELIVERY_FEE, [totalPrice]);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
        setServerError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        const validation = validate(form);
        setErrors(validation);
        if (Object.keys(validation).length > 0) return;

        const cardDigits = form.cardNumber.replace(/\D/g, '');
        const last4 = cardDigits.slice(-4);

        const payload = {
            items: items.map((it) => ({
                id: it.id,
                title: it.title,
                brand: it.brand,
                size: it.size,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                priceLabel: it.priceLabel,
            })),
            customer: {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
            },
            address: {
                city: form.city,
                street: form.street.trim(),
                house: form.house.trim(),
                apartment: form.apartment.trim(),
                postalCode: form.postalCode,
                comment: form.comment.trim(),
            },
            card: {
                last4,
                expiry: form.cardExpiry,
                holder: form.cardHolder.trim() || undefined,
            },
            telegramChatId: form.telegramChatId.trim(),
        };

        setSubmitting(true);
        try {
            const res = await fetch('/api/checkout/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = (await res.json()) as {
                ok?: boolean;
                orderId?: string;
                total?: number;
                error?: string;
                detail?: string;
            };
            if (!res.ok || !data.ok) {
                if (data.error === 'telegram_send_failed') {
                    setServerError(
                        `Не удалось отправить уведомление в Telegram (${data.detail || 'unknown'}). Проверьте chat ID.`
                    );
                } else if (data.error === 'telegram_chat_id') {
                    setErrors((prev) => ({
                        ...prev,
                        telegramChatId: 'Неверный chat ID',
                    }));
                } else {
                    setServerError('Ошибка оформления заказа. Попробуйте ещё раз.');
                }
                return;
            }
            setSuccess({ orderId: data.orderId!, total: data.total ?? grandTotal });
            clearCart();
        } catch (err) {
            console.error(err);
            setServerError('Сеть недоступна. Попробуйте ещё раз.');
        } finally {
            setSubmitting(false);
        }
    };

    if (hydrated && items.length === 0 && !success) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center" aria-label="SMARTBUY">
                            <Logo size={44} priority />
                        </Link>
                        <UserMenu />
                    </div>
                </header>
                <main className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="checkout-empty">
                    <h1 className="text-2xl font-bold mb-3">Корзина пуста</h1>
                    <p className="text-gray-500 mb-6">
                        Сначала добавьте товары в корзину, чтобы оформить заказ.
                    </p>
                    <Link href="/products">
                        <Button>Перейти в каталог</Button>
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center" aria-label="SMARTBUY">
                        <Logo size={44} priority />
                    </Link>
                    <UserMenu />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">
                {success ? (
                    <div
                        className="max-w-xl mx-auto bg-white border rounded-2xl p-10 text-center"
                        data-testid="checkout-success"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                            <CreditCard className="h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Заказ оформлен</h1>
                        <p className="text-gray-500 mb-6">
                            Номер заказа:{' '}
                            <span
                                className="font-mono font-semibold text-gray-900"
                                data-testid="success-order-id"
                            >
                                {success.orderId}
                            </span>
                        </p>
                        <p className="text-gray-700 mb-8">
                            Сумма к оплате: <span className="font-bold">{formatKzt(success.total)}</span>.
                            <br />
                            Уведомление о заказе отправлено в Telegram.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/products">
                                <Button variant="outline">В каталог</Button>
                            </Link>
                            <Button onClick={() => router.push('/')}>На главную</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 flex items-center gap-3">
                            <CreditCard className="h-7 w-7 text-blue-600" />
                            <h1 className="text-3xl font-bold tracking-tight">Оформление заказа</h1>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            data-testid="checkout-form"
                            noValidate
                        >
                            <div className="lg:col-span-2 space-y-6">
                                <section className="bg-white border rounded-xl p-6 space-y-4">
                                    <h2 className="text-lg font-semibold">Контактные данные</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FieldInput
                                            label="ФИО"
                                            value={form.fullName}
                                            onChange={(v) => update('fullName', v)}
                                            error={errors.fullName}
                                            testid="field-fullName"
                                            placeholder="Айбек Серикулы"
                                        />
                                        <FieldInput
                                            label="Email"
                                            type="email"
                                            value={form.email}
                                            onChange={(v) => update('email', v)}
                                            error={errors.email}
                                            testid="field-email"
                                            placeholder="you@example.com"
                                        />
                                        <FieldInput
                                            label="Телефон"
                                            value={form.phone}
                                            onChange={(v) => update('phone', formatKzPhone(v))}
                                            error={errors.phone}
                                            testid="field-phone"
                                            placeholder="+7 (___) ___-__-__"
                                        />
                                    </div>
                                </section>

                                <section className="bg-white border rounded-xl p-6 space-y-4">
                                    <h2 className="text-lg font-semibold">Адрес доставки (Казахстан)</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Город
                                            </label>
                                            <select
                                                value={form.city}
                                                onChange={(e) => update('city', e.target.value)}
                                                data-testid="field-city"
                                                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {KZ_CITIES.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.city && (
                                                <p className="text-xs text-red-600">{errors.city}</p>
                                            )}
                                        </div>
                                        <FieldInput
                                            label="Почтовый индекс"
                                            value={form.postalCode}
                                            onChange={(v) => update('postalCode', v.replace(/\D/g, '').slice(0, 6))}
                                            error={errors.postalCode}
                                            testid="field-postalCode"
                                            placeholder="050000"
                                        />
                                        <FieldInput
                                            label="Улица"
                                            value={form.street}
                                            onChange={(v) => update('street', v)}
                                            error={errors.street}
                                            testid="field-street"
                                            placeholder="пр. Достык"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <FieldInput
                                                label="Дом"
                                                value={form.house}
                                                onChange={(v) => update('house', v)}
                                                error={errors.house}
                                                testid="field-house"
                                                placeholder="12А"
                                            />
                                            <FieldInput
                                                label="Кв./офис"
                                                value={form.apartment}
                                                onChange={(v) => update('apartment', v)}
                                                testid="field-apartment"
                                                placeholder="48"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">
                                            Комментарий курьеру (опционально)
                                        </label>
                                        <textarea
                                            value={form.comment}
                                            onChange={(e) => update('comment', e.target.value)}
                                            data-testid="field-comment"
                                            rows={3}
                                            placeholder="Код домофона, как удобнее позвонить..."
                                            className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </section>

                                <section className="bg-white border rounded-xl p-6 space-y-4">
                                    <div className="flex items-baseline justify-between">
                                        <h2 className="text-lg font-semibold">Оплата банковской картой</h2>
                                        <span className="text-xs text-gray-500">Visa · Mastercard</span>
                                    </div>
                                    <FieldInput
                                        label="Номер карты"
                                        value={form.cardNumber}
                                        onChange={(v) => update('cardNumber', formatCardNumber(v))}
                                        error={errors.cardNumber}
                                        testid="field-cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        inputMode="numeric"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FieldInput
                                            label="Срок (MM/YY)"
                                            value={form.cardExpiry}
                                            onChange={(v) => update('cardExpiry', formatExpiry(v))}
                                            error={errors.cardExpiry}
                                            testid="field-cardExpiry"
                                            placeholder="08/29"
                                            inputMode="numeric"
                                        />
                                        <FieldInput
                                            label="CVC"
                                            value={form.cardCvc}
                                            onChange={(v) =>
                                                update('cardCvc', v.replace(/\D/g, '').slice(0, 4))
                                            }
                                            error={errors.cardCvc}
                                            testid="field-cardCvc"
                                            placeholder="123"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <FieldInput
                                        label="Имя владельца (опционально)"
                                        value={form.cardHolder}
                                        onChange={(v) => update('cardHolder', v.toUpperCase())}
                                        testid="field-cardHolder"
                                        placeholder="AIBEK SERIKULY"
                                    />
                                </section>

                                <section className="bg-white border rounded-xl p-6 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Send className="h-4 w-4 text-blue-600" />
                                        <h2 className="text-lg font-semibold">
                                            Telegram для уведомлений
                                        </h2>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Чтобы узнать свой chat ID, откройте в Telegram бота{' '}
                                        <a
                                            href="https://t.me/userinfobot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            @userinfobot
                                        </a>{' '}
                                        и нажмите Start. Затем напишите боту{' '}
                                        <a
                                            href="https://t.me/smart_buy20_bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            @smart_buy20_bot
                                        </a>{' '}
                                        слово /start, чтобы он мог вам писать.
                                    </p>
                                    <FieldInput
                                        label="Telegram chat ID"
                                        value={form.telegramChatId}
                                        onChange={(v) =>
                                            update('telegramChatId', v.replace(/[^\d-]/g, '').slice(0, 16))
                                        }
                                        error={errors.telegramChatId}
                                        testid="field-telegramChatId"
                                        placeholder="123456789"
                                        inputMode="numeric"
                                    />
                                </section>
                            </div>

                            <aside className="lg:col-span-1">
                                <div className="bg-white border rounded-xl p-6 sticky top-24" data-testid="checkout-summary">
                                    <h2 className="text-lg font-semibold mb-4">Ваш заказ</h2>
                                    <ul className="space-y-3 max-h-64 overflow-auto pr-1 mb-4">
                                        {items.map((item) => (
                                            <li
                                                key={`${item.id}-${item.size ?? ''}`}
                                                className="flex gap-3 text-sm"
                                            >
                                                <div className="relative w-14 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover object-top"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-gray-900 line-clamp-2">{item.title}</div>
                                                    <div className="text-gray-500 text-xs">
                                                        {item.quantity} ×{' '}
                                                        {item.size ? `Размер ${item.size}, ` : ''}
                                                        {formatKzt(item.unitPrice)}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <dl className="space-y-2 text-sm border-t pt-4">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-600">Товары ({totalCount})</dt>
                                            <dd className="font-medium">{formatKzt(totalPrice)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-600">Доставка по РК</dt>
                                            <dd className="font-medium">{formatKzt(DELIVERY_FEE)}</dd>
                                        </div>
                                        <div className="h-px bg-gray-200 my-3" />
                                        <div className="flex justify-between text-base">
                                            <dt className="font-semibold">К оплате</dt>
                                            <dd className="font-bold" data-testid="checkout-total">
                                                {formatKzt(grandTotal)}
                                            </dd>
                                        </div>
                                    </dl>

                                    {serverError && (
                                        <p
                                            className="text-sm text-red-600 mt-4"
                                            data-testid="checkout-server-error"
                                        >
                                            {serverError}
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full h-12 mt-6 text-base"
                                        data-testid="submit-order"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Оплачиваем...
                                            </>
                                        ) : (
                                            <>Оплатить {formatKzt(grandTotal)}</>
                                        )}
                                    </Button>

                                    <Link href="/cart" className="block mt-3">
                                        <Button variant="ghost" className="w-full gap-2" type="button">
                                            <ArrowLeft className="h-4 w-4" />
                                            Назад в корзину
                                        </Button>
                                    </Link>
                                </div>
                            </aside>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}

interface FieldInputProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    testid?: string;
    placeholder?: string;
    type?: string;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}

function FieldInput({
    label,
    value,
    onChange,
    error,
    testid,
    placeholder,
    type = 'text',
    inputMode,
}: FieldInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <Input
                type={type}
                inputMode={inputMode}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
