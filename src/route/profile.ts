import { Hono } from "hono"
import { db } from "../db"
import { profile, userTag, tag, userAvailability, user } from "../db/schema";
import { eq, sql, and, ne } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import { nanoid } from "nanoid";

const app = new Hono<{
    Variables: {
        user: {
            id: string,
        } | null,
    }
}>();

app.get("/", async (c) => {
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const dbUser = await db.select().from(user).where(eq(user.id, authUser.id))
    if (dbUser.length === 0) {
        await db.insert(user).values({
            id: authUser.id,
        })
    }
    const newUser = await db.select().from(user).where(eq(user.id, authUser.id))

    const pro = await db.select().from(profile).where(eq(profile.userId, authUser.id))
    if (pro.length === 0) {
        const newProfile = await db.insert(profile).values({
            id: randomUUIDv7(),
            userId: authUser.id,
            handle: nanoid(10),
        }).returning();
        return c.json({
            message: "Profile created",
            profile: newProfile,
            tags: [],
            availability: []
        })
    }
    const tags = await db.select({
        id: tag.id,
        content: tag.content,
        category: tag.category,
    }).from(userTag).where(eq(userTag.userId, authUser.id)).leftJoin(tag, eq(userTag.tagId, tag.id))
    const availability = await db.select().from(userAvailability).where(eq(userAvailability.userId, authUser.id))

    return c.json({
        message: "Profile found",
        profile: {
            ...pro[0],
            role: newUser[0].role,
        },
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

    let myProfile = await db.select({
        isVerified: profile.isVerified,
    }).from(profile).where(eq(profile.userId, authUser.id))

    if (!myProfile[0].isVerified) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const profiles = await db.select({
        userId: profile.userId,
        name: profile.name,
        handle: profile.handle,
        gender: profile.gender,
        avatarUrl: profile.avatarUrl,
        statusMessage: profile.statusMessage,
        expertiseSummary: profile.expertiseSummary,
    }).from(profile)

    let result = []

    for (const profile of profiles) {
        const tags = await db.select({
            id: tag.id,
            content: tag.content,
            category: tag.category,
        }).from(userTag).where(eq(userTag.userId, profile.userId)).leftJoin(tag, eq(userTag.tagId, tag.id))
        const availability = await db.select().from(userAvailability).where(eq(userAvailability.userId, profile.userId))
        const tempProfile = {
            profile: profile,
            tags: tags,
            availability: availability
        }
        result.push(tempProfile)
    }

    return c.json({
        message: "Profiles",
        profiles: result
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
    const authUser = c.get("user")
    if (!authUser) {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const authUserProfile = await db.select({
        isVerified: profile.isVerified,
    }).from(profile).where(eq(profile.userId, authUser.id))

    if (!authUserProfile[0].isVerified) {
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
    const locationVisibility = userProfile.locationVisibility
    if (locationVisibility < 2) {
        userProfile.district = ""
        if (locationVisibility < 1) {
            userProfile.city = ""
        }
    }
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
        const existingProfile = await db.select().from(profile).where(and(eq(profile.handle, handle), ne(profile.userId, user.id)))
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
        if (!/^[A-Za-z0-9_-]+$/.test(handle)) {
            return c.json({
                message: "Handle must contain only A-Z, a-z, 0-9, -, _"
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