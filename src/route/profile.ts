import { Hono } from "hono"
import { auth } from "../lib/auth"
import { db } from "../db"
import { profile, userTag, tag, userAvailability, user } from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import { nanoid } from "nanoid";

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>();

app.get("/", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const pro = await db.select().from(profile).where(eq(profile.userId, user.id))
    if (pro.length === 0) {
        const newProfile = await db.insert(profile).values({
            id: randomUUIDv7(),
            userId: user.id,
            handle: nanoid(10),
        }).returning();
        return c.json({
            message: "Profile created",
            profile: newProfile
        })
    }
    const tags = await db.select({
        id: tag.id,
        content: tag.content,
        category: tag.category,
    }).from(userTag).where(eq(userTag.userId, user.id)).leftJoin(tag, eq(userTag.tagId, tag.id))
    const availability = await db.select().from(userAvailability).where(eq(userAvailability.userId, user.id))

    return c.json({
        message: "Profile found",
        profile: pro[0],
        tags: tags,
        availability: availability
    })
})

app.get("/all", async (c) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const profiles = await db.select({
        userId: profile.userId,
        name: user.name,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
        statusMessage: profile.statusMessage,
        expertiseSummary: profile.expertiseSummary,
    }).from(profile).leftJoin(user, eq(profile.userId, user.id))

    return c.json({
        message: "Profiles",
        profiles: profiles
    })
})

app.get("/tags", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const tags = await db.select().from(tag)

    return c.json({
        message: "Tags",
        tags: tags
    })
})

app.get("/:userId", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const userId = c.req.param("userId")
    const pro = await db.select().from(profile).where(eq(profile.userId, userId))
    if (pro.length === 0) {
        return c.json({
            message: "Profile not found"
        }, 404)
    }
    let userProfile = pro[0]
    // WIP: - control what a normal user can see
    userProfile.wechat = ""
    const tags = await db.select({
        id: tag.id,
        content: tag.content,
        category: tag.category,
    }).from(userTag).where(eq(userTag.userId, userId)).leftJoin(tag, eq(userTag.tagId, tag.id))
    const availability = await db.select().from(userAvailability).where(eq(userAvailability.userId, userId))

    return c.json({
        message: "Profile found",
        profile: userProfile,
        tags: tags,
        availability: availability
    })
})

app.post("/", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const body = await c.req.json()
    const snapshot = body.snapshot
    const handle = snapshot.handle
    if (handle) {
        const existingProfile = await db.select().from(profile).where(eq(profile.handle, handle))
        if (existingProfile.length > 0) {
            return c.json({
                message: "Handle already exists"
            }, 400)
        }
        if (handle.length < 10) {
            return c.json({
                message: "Handle must be at least 10 characters"
            }, 400)
        }
    } else {
        return c.json({
            message: "Handle is required"
        }, 400)
    }
    const newProfile = await db.update(profile).set({
        newSnapshot: snapshot,
        updatedAt: sql`now()`
    }).where(eq(profile.userId, user.id))

    return c.json({
        message: "Profile updated",
        profile: newProfile
    })
})

app.post("/tags", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const body = await c.req.json()
    const tags = body.tags
    for (const tag of tags) {
        const newTagRelation = await db.insert(userTag).values({
            userId: user.id,
            tagId: tag,
        }).onConflictDoNothing()
    }

    return c.json({
        message: "Tags updated"
    })
})

app.delete("/tags/:tagId", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const tagId = c.req.param("tagId")
    const newTagRelation = await db.delete(userTag).where(and(eq(userTag.userId, user.id), eq(userTag.tagId, tagId)))

    return c.json({
        message: "Tag deleted"
    })
})

app.post("/availability", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const body = await c.req.json()
    const timeSlots = body.timeSlots
    for (const timeSlot of timeSlots) {
        const newAvailability = await db.insert(userAvailability).values({
            userId: user.id,
            weekDay: timeSlot.weekDay,
            timeSlot: timeSlot.timeSlot,
        }).onConflictDoNothing()
    }

    return c.json({
        message: "Availability updated"
    })
})


app.delete("/availability/:weekDay/:timeSlot", async (c) => {
    const user = c.get("user")
    if (!user) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const weekDay = parseInt(c.req.param("weekDay"))
    const timeSlot = parseInt(c.req.param("timeSlot"))
    const newAvailability = await db.delete(userAvailability).where(and(eq(userAvailability.userId, user.id), eq(userAvailability.weekDay, weekDay), eq(userAvailability.timeSlot, timeSlot)))

    return c.json({
        message: "Availability deleted"
    })
})


export default app