export {};

declare global {
  namespace Express {
    interface Request {
      /** Raw JSON body buffer for POST /webhook (HMAC verification) */
      rawBody?: Buffer;
      /** Correlation id (from `x-request-id` or generated) */
      id?: string;
      /** Auth user (`auth_users.id`) when JWT is present */
      userId?: string;
      /** Tenant (`businesses.id`) when JWT is present */
      businessId?: string;
    }
  }
}
