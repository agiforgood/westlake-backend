import { Hono } from "hono"
import { db } from "../db"
import { profile, userTag, tag, userAvailability, user, message } from "../db/schema";
import { eq, sql, and, ne, desc, or } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import { nanoid } from "nanoid";
import { textModeration } from "../lib/moderation"

const app = new Hono<{
    Variables: {
        user: {
            id: string,
        } | null,
    }
}>();

app.get("/list", async (c) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }
    const sessions = await db.execute(
        sql`
        SELECT DISTINCT ON (
            LEAST(sender_id, receiver_id),
            GREATEST(sender_id, receiver_id)
        ) id, content, sender_id, receiver_id, created_at, updated_at
        FROM message
        WHERE sender_id = ${authUser.id} OR receiver_id = ${authUser.id}
        ORDER BY
            LEAST(sender_id, receiver_id),
            GREATEST(sender_id, receiver_id),
            created_at DESC
        `
    );
    return c.json({
        message: "Chat sessions",
        sessions: sessions.rows
    })
})

app.get("/messages/:userId", async (c) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }
    const userId = c.req.param("userId")
    const messages = await db.select().from(message).where(or(
        and(
            eq(message.senderId, authUser.id),
            eq(message.receiverId, userId)
        ),
        and(
            eq(message.senderId, userId),
            eq(message.receiverId, authUser.id)
        )
    )).orderBy(desc(message.createdAt))
    const lastReceivedMessage = await db.select().from(message).where(and(
        eq(message.senderId, userId),
        eq(message.receiverId, authUser.id)
    )).orderBy(desc(message.createdAt)).limit(1)
    if (lastReceivedMessage.length > 0) {
        await db.update(message).set({
            updatedAt: sql`now()`
        }).where(eq(message.id, lastReceivedMessage[0].id))
    }

    return c.json({
        message: "Messages",
        messages: messages
    })
})

app.post("/send", async (c) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }
    const { receiverId, content } = await c.req.json()
    const receiver = await db.select().from(user).where(eq(user.id, receiverId))
    if (receiver.length === 0) {
        return c.json({
            message: "Receiver not found"
        }, 404)
    }
    const moderationResult = await textModeration(content)
    if (!moderationResult.isGood) {
        return c.json({
            message: "Content is not good"
        }, 400)
    }
    const newMessage = await db.insert(message).values({
        id: randomUUIDv7(),
        content: content,
        senderId: authUser.id,
        receiverId: receiverId,
    })
    return c.json({
        message: "Message sent"
    })
})

export default app;
