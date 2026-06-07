const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_API;
const ENDPOINT = TELEGRAM_TOKEN
    ? `https://api.telegram.org/bot${TELEGRAM_TOKEN}`
    : null;

export interface TelegramResult {
    ok: boolean;
    error?: string;
    messageId?: number;
}

interface TelegramApiResponse {
    ok: boolean;
    description?: string;
    error_code?: number;
    result?: { message_id?: number };
}

/**
 * Escape user-controlled strings for Telegram MarkdownV2 mode. Telegram
 * requires every reserved character in the message body to be escaped with
 * a backslash, otherwise the API rejects the payload (400 Bad Request).
 */
export function escapeMarkdownV2(input: string): string {
    return input.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (m) => `\\${m}`);
}

export async function sendTelegramMessage(
    chatId: string,
    text: string
): Promise<TelegramResult> {
    if (!ENDPOINT) {
        return { ok: false, error: 'telegram_token_missing' };
    }

    try {
        const res = await fetch(`${ENDPOINT}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            }),
        });
        const data = (await res.json()) as TelegramApiResponse;
        if (!data.ok) {
            return {
                ok: false,
                error: data.description || `telegram_error_${data.error_code ?? 'unknown'}`,
            };
        }
        return { ok: true, messageId: data.result?.message_id };
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
