// Central API URL — reads from env variable in production, falls back to localhost in dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export default API_URL;
