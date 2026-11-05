import {env} from 'cloudflare:workers';
import {league} from '../../../lib/league-service';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>league(env.DB,req);
export const POST=(req:Request)=>league(env.DB,req);
