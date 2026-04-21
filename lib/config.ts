const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTHORIZATION_ENDPOINT = process.env.AUTHORIZATION_ENDPOINT || 'https://github.com/login/oauth/authorize';
const TOKEN_ENDPOINT = process.env.TOKEN_ENDPOINT || 'https://github.com/login/oauth/access_token';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const LIMIT_REQUESTS_PER_MINUTE = parseInt(process.env.LIMIT_REQUESTS_PER_MINUTE || '60', 10);
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const DEVICE_PASSWORD = process.env.DEVICE_PASSWORD;

export { BASE_URL, AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, CLIENT_ID, CLIENT_SECRET, LIMIT_REQUESTS_PER_MINUTE, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, DEVICE_PASSWORD };


