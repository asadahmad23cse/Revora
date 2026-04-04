export {};

declare global {
  namespace Express {
    interface Request {
      /** Raw JSON body buffer for POST /webhook (HMAC verification) */
      rawBody?: Buffer;
      /** Correlation id (from `x-request-id` or generated) */
      id?: string;
    }
  }
}
