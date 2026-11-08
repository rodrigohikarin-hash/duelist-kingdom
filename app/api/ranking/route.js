import { env } from 'cloudflare:workers';
import { getRanking } from '../../../lib/ranking-service.js';

export const dynamic = 'force-dynamic';
export const GET = (request) => getRanking(env.DB, request);
