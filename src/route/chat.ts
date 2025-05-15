import { Hono } from "hono"
import { db } from "../db"
import { user, message } from "../db/schema";
import { eq, sql, and, desc, or } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
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
        ) m.id, m.content, m.sender_id, m.receiver_id, m.created_at, m.updated_at,
        sender_profile.name as sender_name,
        receiver_profile.name as receiver_name
        FROM message m
        LEFT JOIN profile sender_profile ON sender_profile.user_id = m.sender_id
        LEFT JOIN profile receiver_profile ON receiver_profile.user_id = m.receiver_id
        WHERE m.sender_id = ${authUser.id} OR m.receiver_id = ${authUser.id}
        ORDER BY
            LEAST(m.sender_id, m.receiver_id),
            GREATEST(m.sender_id, m.receiver_id),
            m.created_at DESC
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
