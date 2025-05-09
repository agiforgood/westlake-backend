import { createMiddleware } from "hono/factory"
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwks = createRemoteJWKSet(new URL('https://auth.westlakeaiforgood.com/oidc/jwks'));
const ISSUER = 'https://auth.westlakeaiforgood.com/oidc';
const AUDIENCE = 'https://api.westlakeaiforgood.com';

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization")
    if (!authHeader) {
        c.set('user', null);
        return next();
    }
    if (!authHeader.startsWith("Bearer ")) {
        c.set('user', null);
        return next();
    }
    const token = authHeader.slice(7);
    try {
        const { payload } = await jwtVerify(token, jwks, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        const { sub } = payload;
        c.set('user', { id: sub as string });
        await next();
    } catch (err) {
        console.log(err)
        c.set('user', null);
        return next();
    }
})