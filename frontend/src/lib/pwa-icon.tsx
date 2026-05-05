import type { CSSProperties, ReactElement } from 'react';

type Variant = 'square' | 'maskable';

interface IconGraphicProps {
    size: number;
    variant?: Variant;
}

const BRAND_GRADIENT = 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #7c3aed 100%)';
const HIGHLIGHT = 'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 55%)';

const BAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 1.85 1.995H19.15A2 2 0 0 0 21 20V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>`;
const BAG_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(BAG_SVG).toString('base64')}`;

export function IconGraphic({ size, variant = 'square' }: IconGraphicProps): ReactElement {
    const radius = variant === 'maskable' ? size / 2 : Math.round(size * 0.22);
    const padding = variant === 'maskable' ? Math.round(size * 0.22) : Math.round(size * 0.18);
    const innerSize = size - padding * 2;

    const wrapperStyle: CSSProperties = {
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_GRADIENT,
        borderRadius: radius,
        position: 'relative',
        overflow: 'hidden',
    };

    const sheenStyle: CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: HIGHLIGHT,
        display: 'flex',
    };

    const bagStyle: CSSProperties = {
        width: innerSize,
        height: innerSize,
        filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))',
    };

    return (
        <div style={wrapperStyle}>
            <div style={sheenStyle} />
            <img src={BAG_DATA_URL} width={innerSize} height={innerSize} style={bagStyle} alt="" />
        </div>
    );
}

export const BRAND_BACKGROUND = '#0b1020';
export const BRAND_THEME = '#2563eb';
