const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTHORIZATION_ENDPOINT = process.env.AUTHORIZATION_ENDPOINT || 'https://github.com/login/oauth/authorize';
const TOKEN_ENDPOINT = process.env.TOKEN_ENDPOINT || 'https://github.com/login/oauth/access_token';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const LIMIT_REQUESTS_PER_MINUTE = parseInt(process.env.LIMIT_REQUESTS_PER_MINUTE || '60', 10);
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;

export { BASE_URL, AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, CLIENT_ID, CLIENT_SECRET, LIMIT_REQUESTS_PER_MINUTE, UPSTASH_REDIS_URL };
