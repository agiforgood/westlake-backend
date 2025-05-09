import { createMiddleware } from "hono/factory"
import { db } from "../db"
import { user } from "../db/schema"
import { eq } from "drizzle-orm"

export const adminMiddleware = createMiddleware(async (c, next) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const dbUser = await db.select().from(user).where(eq(user.id, authUser.id))
    if (dbUser.length === 0) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    if (dbUser[0].role !== "admin") {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    await next()
})