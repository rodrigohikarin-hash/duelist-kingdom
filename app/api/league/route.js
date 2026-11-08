import { env } from 'cloudflare:workers';
import { league } from '../../../lib/league-service.js';
export const dynamic = 'force-dynamic';
export const GET = (req) => league(env.DB, req);
export const POST = (req) => league(env.DB, req);
