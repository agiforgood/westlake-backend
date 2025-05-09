import { Hono } from "hono"
import { db } from "../db"
import { profile, tag, user } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import { adminMiddleware } from "../middleware/admin";

const app = new Hono<{
    Variables: {
        user: {
            id: string,
        } | null,
    }
}>();

app.use("*", adminMiddleware)

app.get("/profiles/waiting", async (c) => {
    const waitingProfiles = await db.select().from(profile).where(isNotNull(profile.newSnapshot))

    return c.json({
        message: "Waiting profiles",
        profiles: waitingProfiles
    })
})

app.post("/profiles", async (c) => {
    const body = await c.req.json()
    const userId = body.userId
    const isApproved = body.isApproved
    const profileIds = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
    if (profileIds.length === 0) {
        return c.json({
            message: "Profile not found"
        }, 404)
    }
    const profileId = profileIds[0].id

    if (isApproved) {
        const oldProfile = await db.select().from(profile).where(eq(profile.id, profileId))
        const snapshot: any = oldProfile[0].newSnapshot
        const newProfile = await db.update(profile).set({
            handle: snapshot.handle,
            gender: snapshot.gender,
            name: snapshot.name,
            avatarUrl: snapshot.avatarUrl,
            bannerUrl: snapshot.bannerUrl,
            statusMessage: snapshot.statusMessage,
            expertiseSummary: snapshot.expertiseSummary,
            bio: snapshot.bio,
            backgroundDescription: snapshot.backgroundDescription,
            motivation: snapshot.motivation,
            expectations: snapshot.expectations,
            canOffer: snapshot.canOffer,
            wechat: snapshot.wechat,
            locationVisibility: snapshot.locationVisibility,
            province: snapshot.province,
            city: snapshot.city,
            district: snapshot.district,
            newSnapshot: null,
        }).where(eq(profile.id, profileId))
    } else {
        const newProfile = await db.update(profile).set({
            newSnapshot: null,
        }).where(eq(profile.id, profileId))
    }

    return c.json({
        message: "Profile updated",
    })
})

app.get("/tags", async (c) => {
    const tags = await db.select().from(tag)

    return c.json({
        message: "Tags",
        tags: tags
    })
})

app.post("/tags", async (c) => {
    const body = await c.req.json()
    const content = body.content
    const category = body.category
    const newTag = await db.insert(tag).values({
        id: randomUUIDv7(),
        content: content,
        category: category,
    }).returning();

    return c.json({
        message: "Tag created",
        tag: newTag
    })
})

app.delete("/tags/:tagId", async (c) => {
    const tagId = c.req.param("tagId")
    await db.delete(tag).where(eq(tag.id, tagId))

    return c.json({
        message: "Tag deleted",
    })
})

export default app