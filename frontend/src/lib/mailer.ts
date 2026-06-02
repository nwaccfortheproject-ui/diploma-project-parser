import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.RESEND_FROM || 'SMARTBUY <onboarding@resend.dev>';

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
    if (!RESEND_API_KEY) return null;
    if (!cachedResend) cachedResend = new Resend(RESEND_API_KEY);
    return cachedResend;
}

export function buildCodeEmail(code: string): { subject: string; html: string; text: string } {
    const subject = `${code} — код входа в SMARTBUY`;
    const text = `Ваш код входа в SMARTBUY: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход, проигнорируйте это письмо.`;
    const html = `<!doctype html>
<html lang="ru"><body style="margin:0;padding:32px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="padding:32px 32px 8px 32px">
      <div style="font-weight:700;letter-spacing:-0.02em;font-size:20px;color:#1e3a8a">SMARTBUY</div>
    </td></tr>
    <tr><td style="padding:16px 32px 8px 32px">
      <h1 style="margin:0;font-size:22px;color:#0f172a">Ваш код для входа</h1>
      <p style="margin:8px 0 24px 0;color:#475569;font-size:14px;line-height:1.5">
        Введите этот код в открытом окне, чтобы войти в аккаунт. Код действует 10 минут.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 24px 32px">
      <div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:0.4em;text-align:center;background:#f1f5f9;border-radius:12px;padding:20px 0;color:#0f172a">
        ${code}
      </div>
    </td></tr>
    <tr><td style="padding:0 32px 32px 32px;color:#94a3b8;font-size:12px;line-height:1.5">
      Если вы не запрашивали вход в SMARTBUY, просто проигнорируйте это письмо.
    </td></tr>
  </table>
</body></html>`;
    return { subject, html, text };
}

interface SendResult {
    delivered: boolean;
    transport: 'resend' | 'console';
    id?: string;
    error?: string;
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<SendResult> {
    const { subject, html, text } = buildCodeEmail(code);
    const resend = getResend();

    if (!resend) {
        // No API key — log to server console so devs and Playwright can see it.
        console.log(`\n[mailer] no RESEND_API_KEY; verification code for ${to}: ${code}\n`);
        return { delivered: false, transport: 'console' };
    }

    try {
        const res = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject,
            html,
            text,
        });
        if (res.error) {
            console.error('[mailer] resend error:', res.error);
            return { delivered: false, transport: 'resend', error: String(res.error) };
        }
        return { delivered: true, transport: 'resend', id: res.data?.id };
    } catch (err) {
        console.error('[mailer] resend threw:', err);
        return {
            delivered: false,
            transport: 'resend',
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
