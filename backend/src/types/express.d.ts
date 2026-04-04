export {};

declare global {
  namespace Express {
    interface Request {
      /** Raw JSON body buffer for POST /webhook (HMAC verification) */
      rawBody?: Buffer;
      /** Correlation id (from `x-request-id` or generated) */
      id?: string;
      /** Set by `requireAuth` when Authorization: Bearer <JWT> is valid */
      userId?: string;
      businessId?: string;
    }
  }
}
