import type { Request } from 'express';
import type { JwtUserPayload } from './jwt-user-payload.type';

export interface AuthenticatedRequest extends Request {
  user: JwtUserPayload;
}
