'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SEC = 30;

type Stage = 'email' | 'code';

interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const router = useRouter();
    const [stage, setStage] = useState<Stage>('email');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [resendIn, setResendIn] = useState(0);
    const codeInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) {
            // Reset everything when the dialog closes so the next open starts clean.
            setStage('email');
            setEmail('');
            setName('');
            setCode('');
            setError('');
            setInfo('');
            setResendIn(0);
            setSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    useEffect(() => {
        if (stage === 'code') codeInputRef.current?.focus();
    }, [stage]);

    const requestCode = async () => {
        setError('');
        setInfo('');
        const normalized = email.trim().toLowerCase();
        if (!EMAIL_RE.test(normalized)) {
            setError('Введите корректный email');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalized, name: name.trim() || undefined }),
            });
            if (res.status === 429) {
                setError('Слишком много запросов. Попробуйте через минуту.');
                return;
            }
            if (!res.ok) {
                setError('Не удалось отправить код. Попробуйте ещё раз.');
                return;
            }
            const data = (await res.json()) as {
                transport?: 'resend' | 'console';
                delivered?: boolean;
            };
            setStage('code');
            setResendIn(RESEND_COOLDOWN_SEC);
            setInfo(
                data.delivered
                    ? `Мы отправили 6-значный код на ${normalized}. Код действует 10 минут.`
                    : `Код для ${normalized} сгенерирован. Проверьте логи сервера (отправка email отключена).`
            );
        } catch (err) {
            console.error(err);
            setError('Сеть недоступна. Попробуйте ещё раз.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitCode = async () => {
        setError('');
        const cleaned = code.replace(/\D/g, '').slice(0, 6);
        if (cleaned.length !== 6) {
            setError('Введите 6-значный код из письма');
            return;
        }
        setSubmitting(true);
        try {
            const res = await signIn('email-code', {
                email: email.trim().toLowerCase(),
                code: cleaned,
                redirect: false,
            });
            if (res?.error) {
                setError('Неверный или истёкший код. Запросите новый.');
                return;
            }
            onOpenChange(false);
            router.refresh();
        } catch (err) {
            console.error(err);
            setError('Не удалось войти. Попробуйте ещё раз.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (stage === 'email') requestCode();
        else submitCode();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                        <Mail className="h-5 w-5" />
                    </div>
                    <DialogTitle>
                        {stage === 'email' ? 'Войти в SMARTBUY' : 'Введите код из письма'}
                    </DialogTitle>
                    <DialogDescription>
                        {stage === 'email'
                            ? 'Мы отправим 6-значный код на ваш email — пароль не нужен.'
                            : `Код отправлен на ${email}. Действует 10 минут.`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
                    {stage === 'email' && (
                        <>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                data-testid="auth-email"
                                autoComplete="email"
                            />
                            <Input
                                placeholder="Имя (опционально)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                data-testid="auth-name"
                                autoComplete="given-name"
                            />
                        </>
                    )}

                    {stage === 'code' && (
                        <>
                            <Input
                                ref={codeInputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="• • • • • •"
                                value={code}
                                onChange={(e) =>
                                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                required
                                data-testid="auth-code"
                                className="text-center text-2xl font-mono tracking-[0.6em] h-14"
                                autoComplete="one-time-code"
                            />
                            <div className="flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStage('email');
                                        setCode('');
                                        setError('');
                                        setInfo('');
                                    }}
                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                                    data-testid="auth-change-email"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    Изменить email
                                </button>
                                <button
                                    type="button"
                                    onClick={requestCode}
                                    disabled={resendIn > 0 || submitting}
                                    className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                                    data-testid="auth-resend"
                                >
                                    {resendIn > 0
                                        ? `Отправить снова через ${resendIn}s`
                                        : 'Отправить код ещё раз'}
                                </button>
                            </div>
                        </>
                    )}

                    {info && !error && (
                        <p className="text-xs text-gray-600" data-testid="auth-info">
                            {info}
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-red-600" data-testid="auth-error">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={submitting}
                        data-testid="auth-submit"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {stage === 'email' ? 'Отправляем код...' : 'Проверяем...'}
                            </>
                        ) : stage === 'email' ? (
                            'Получить код'
                        ) : (
                            'Войти'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
