import { NextRequest, NextResponse } from 'next/server';
import { escapeMarkdownV2, sendTelegramMessage } from '@/lib/telegram';

const DELIVERY_FEE = 1990;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHAT_ID_RE = /^-?\d{5,15}$/;

interface SubmittedItem {
    id?: string;
    title?: string;
    brand?: string;
    size?: string | null;
    quantity?: number;
    unitPrice?: number;
    priceLabel?: string;
}

interface SubmitBody {
    items?: SubmittedItem[];
    customer?: {
        fullName?: string;
        email?: string;
        phone?: string;
    };
    address?: {
        city?: string;
        street?: string;
        house?: string;
        apartment?: string;
        postalCode?: string;
        comment?: string;
    };
    card?: {
        last4?: string;
        expiry?: string;
        holder?: string;
    };
    telegramChatId?: string;
}

function fmtKzt(amount: number): string {
    return `${amount.toLocaleString('ru-RU').replace(/,/g, ' ')} тг`;
}

function fail(error: string, status = 400) {
    return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as SubmitBody | null;
        if (!body) return fail('invalid_body');

        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0) return fail('empty_cart');

        const customer = body.customer ?? {};
        const address = body.address ?? {};
        const card = body.card ?? {};
        const chatId = body.telegramChatId?.trim();

        if (!customer.fullName || customer.fullName.trim().length < 2) return fail('fullName');
        if (!customer.email || !EMAIL_RE.test(customer.email)) return fail('email');
        const phoneDigits = (customer.phone || '').replace(/\D/g, '');
        if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) return fail('phone');
        if (!address.city || !address.street || !address.house) return fail('address');
        if (!/^\d{6}$/.test(address.postalCode || '')) return fail('postalCode');
        if (!card.last4 || !/^\d{4}$/.test(card.last4)) return fail('card_last4');
        if (!card.expiry || !/^\d{2}\/\d{2}$/.test(card.expiry)) return fail('card_expiry');
        if (!chatId || !CHAT_ID_RE.test(chatId)) return fail('telegram_chat_id');

        const subtotal = items.reduce(
            (acc, it) => acc + (it.unitPrice ?? 0) * (it.quantity ?? 0),
            0
        );
        const total = subtotal + DELIVERY_FEE;
        const orderId =
            'SB-' +
            Math.floor(Math.random() * 1e9).toString(36).toUpperCase() +
            '-' +
            Math.floor(Math.random() * 1e6).toString(36).toUpperCase();

        const itemsBlock = items
            .map((it) => {
                const title = (it.title || 'Товар').slice(0, 80);
                const qty = it.quantity ?? 1;
                const size = it.size ? `, размер ${it.size}` : '';
                const linePrice = (it.unitPrice ?? 0) * qty;
                return `• ${escapeMarkdownV2(title)}${escapeMarkdownV2(size)} — ${qty} × ${escapeMarkdownV2(fmtKzt(it.unitPrice ?? 0))} \\= *${escapeMarkdownV2(fmtKzt(linePrice))}*`;
            })
            .join('\n');

        const fullAddress = [
            address.city,
            `${address.street}, дом ${address.house}${address.apartment ? `, кв ${address.apartment}` : ''}`,
            `индекс ${address.postalCode}`,
        ]
            .filter(Boolean)
            .join(', ');

        const message = [
            `🛍 *Новый заказ SMARTBUY*`,
            `Номер: \`${escapeMarkdownV2(orderId)}\``,
            ``,
            `*Покупатель*`,
            `ФИО: ${escapeMarkdownV2(customer.fullName)}`,
            `Email: ${escapeMarkdownV2(customer.email)}`,
            `Телефон: ${escapeMarkdownV2(customer.phone || '')}`,
            ``,
            `*Адрес доставки*`,
            escapeMarkdownV2(fullAddress),
            address.comment
                ? `Комментарий: ${escapeMarkdownV2(address.comment)}`
                : '',
            ``,
            `*Товары*`,
            itemsBlock,
            ``,
            `Подытог: ${escapeMarkdownV2(fmtKzt(subtotal))}`,
            `Доставка: ${escapeMarkdownV2(fmtKzt(DELIVERY_FEE))}`,
            `*К оплате: ${escapeMarkdownV2(fmtKzt(total))}*`,
            ``,
            `Оплата: карта \\*\\*\\*\\* ${escapeMarkdownV2(card.last4)}${card.holder ? `, ${escapeMarkdownV2(card.holder)}` : ''}`,
        ]
            .filter((l) => l !== '')
            .join('\n');

        const tg = await sendTelegramMessage(chatId, message);
        if (!tg.ok) {
            console.error('telegram send failed:', tg.error);
            return NextResponse.json(
                { error: 'telegram_send_failed', detail: tg.error },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ok: true,
            orderId,
            total,
            telegramMessageId: tg.messageId,
        });
    } catch (err) {
        console.error('checkout/submit error:', err);
        return NextResponse.json({ error: 'internal' }, { status: 500 });
    }
}
