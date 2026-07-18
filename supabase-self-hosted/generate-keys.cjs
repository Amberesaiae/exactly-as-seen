const crypto = require('crypto');

function generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/=/g, '');
}

// Simple HS256 JWT generation (just the signature part doesn't matter for Supabase local setup 
// if we provide the secret to all services, but for Kong/PostgREST we need valid JWTs)
// Actually, it's easier to use a small library or just use openssl if available.

const jwtSecret = generateSecret(40);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`POSTGRES_PASSWORD=${generateSecret(16)}`);

// For ANON_KEY and SERVICE_ROLE_KEY, we need to sign them.
// Since I don't want to install dependencies, I'll use a pre-calculated ones if possible, 
// but that's not secure.
// Actually, I can use node's crypto to sign.

function signJwt(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret)
        .update(`${header}.${data}`)
        .digest('base64url');
    return `${header}.${data}.${signature}`;
}

const anonKey = signJwt({ role: 'anon', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10 }, jwtSecret);
const serviceKey = signJwt({ role: 'service_role', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10 }, jwtSecret);

console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceKey}`);
