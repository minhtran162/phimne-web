/**
 * Jellyfin NGINX Basic Auth Bootstrapper
 * Decrypts credentials at runtime using Web Crypto API (AES-256-GCM).
 * Supports Chromium 63+ (Tizen 5.0) and Chromium 108+ (webOS 24).
 */

function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
}

async function decryptAES256GCM(encryptedHex, ivHex, tagHex, secretKeyStr) {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(secretKeyStr);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-256-GCM' },
        false,
        ['decrypt']
    );

    const dataBuffer = hexToBuffer(encryptedHex);
    const tagBuffer = hexToBuffer(tagHex);
    const combinedBuffer = new Uint8Array(dataBuffer.byteLength + tagBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(dataBuffer), 0);
    combinedBuffer.set(new Uint8Array(tagBuffer), dataBuffer.byteLength);
    const ivBuffer = hexToBuffer(ivHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-256-GCM', iv: ivBuffer, tagLength: 128 },
        cryptoKey,
        combinedBuffer
    );

    const decoder = new TextDecoder();
    const rawString = decoder.decode(decryptedBuffer);
    return btoa(rawString);
}

/**
 * Initialize the bootstrapper. Must be called before any API requests.
 * Config sources (in priority order):
 *  1. window.__NGINX_CONFIG__  — injected by Tizen gulp build
 *  2. DefinePlugin constants    — injected by webpack build (__NGINX_*__)
 */
export async function init() {
    try {
        const config = window.__NGINX_CONFIG__ || {
            encryptedData: __NGINX_ENCRYPTED_DATA__,
            ivHex: __NGINX_IV__,
            tagHex: __NGINX_TAG__,
            secretKeyStr: __NGINX_SECRET_KEY__,
            jellyfinDomain: __NGINX_JELLYFIN_DOMAIN__,
            username: __NGINX_USERNAME__,
            password: __NGINX_PASSWORD__
        };

        const { encryptedData, ivHex, tagHex, secretKeyStr, jellyfinDomain, username, password } = config;

        let base64Auth;

        // Prefer runtime AES-GCM decryption when a complete encrypted payload + valid key is present
        const hasSubtle = !!(window.crypto && window.crypto.subtle);

        if (hasSubtle && encryptedData && ivHex && tagHex && secretKeyStr && secretKeyStr.length === 32) {
            try {
                base64Auth = await decryptAES256GCM(encryptedData, ivHex, tagHex, secretKeyStr);
                console.log('[JellyfinBoot] NGINX credentials decrypted at runtime (AES-256-GCM).');
            } catch (e) {
                console.warn('[JellyfinBoot] Runtime decryption failed, falling back to build-time auth:', e);
            }
        }

        // Fallback: build-time Basic Auth from username/password
        if (!base64Auth) {
            if (!username || !password) {
                console.warn('[JellyfinBoot] NGINX credentials missing (no encrypted payload or USERNAME/PASSWORD); auth injection disabled.');
                window.__NGINX_AUTH__ = null;
                return;
            }
            base64Auth = btoa(`${username}:${password}`);
            console.log('[JellyfinBoot] Using build-time Basic Auth (no runtime crypto).');
        }

        window.__NGINX_AUTH__ = `Basic ${base64Auth}`;
        window.__NGINX_DOMAIN__ = jellyfinDomain || '';
        console.log('[JellyfinBoot] NGINX Basic Auth credentials initialized.');
    } catch (error) {
        console.error('[JellyfinBoot] Credential init failed:', error);
        window.__NGINX_AUTH__ = null;
    }
}

/**
 * Get the Authorization header value. Returns null if not initialized.
 */
export function getAuthHeader() {
    return window.__NGINX_AUTH__ || null;
}

/**
 * Check if a URL should receive the NGINX auth header.
 */
export function shouldInjectAuth(url) {
    const domain = window.__NGINX_DOMAIN__;
    if (!domain) return true;
    try {
        const urlObj = new URL(url, window.location.origin);
        return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
    } catch {
        return true;
    }
}
