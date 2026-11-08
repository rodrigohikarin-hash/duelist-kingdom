import { env } from 'cloudflare:workers';
import { getEvents, saveEvent } from '../../../lib/events-service.js';

export const dynamic = 'force-dynamic';
export const GET = (request) => getEvents(env.DB, request);
export const PUT = (request) => saveEvent(env.DB, request);
