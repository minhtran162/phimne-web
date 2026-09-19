/**
 * Jellyfin NGINX Basic Auth Credential Encryptor
 * Run: node encrypt-creds.js
 * Outputs encrypted credentials for use across all platforms.
 */
const crypto = require('crypto');

const USERNAME = process.env.NGINX_USERNAME || 'static_username';
const PASSWORD = process.env.NGINX_PASSWORD || 'static_password';
const SECRET_KEY = process.env.NGINX_SECRET_KEY || '';

console.log(USERNAME)

if (SECRET_KEY.length !== 32) {
    console.error('ERROR: NGINX_SECRET_KEY must be exactly 32 characters long!');
    process.exit(1);
}

function encrypt() {
    const rawData = `${USERNAME}:${PASSWORD}`;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(rawData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    console.log('=========================================================');
    console.log('NGINX CREDENTIALS ENCRYPTED SUCCESSFULLY!');
    console.log('=========================================================');
    console.log('Add these to your .env file:');
    console.log(`NGINX_ENCRYPTED_DATA="${encrypted}"`);
    console.log(`NGINX_IV="${iv.toString('hex')}"`);
    console.log(`NGINX_TAG="${authTag}"`);
    console.log(`NGINX_SECRET_KEY="${SECRET_KEY}"`);
    console.log('=========================================================');
}

encrypt();
