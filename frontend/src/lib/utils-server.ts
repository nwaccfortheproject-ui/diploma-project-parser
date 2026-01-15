import { createHash } from 'crypto';

export function generateId(url: string): string {
    return createHash('md5').update(url).digest('hex').substring(0, 12);
}
