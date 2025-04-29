import { Hono } from "hono"
import { auth } from "../lib/auth"
import { db } from "../db"
import { profile, tag } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { randomUUIDv7 } from "bun";

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>();

app.get("/profiles/waiting", async (c) => {
    const user = c.get("user")
    if (!user || user.role !== "admin") {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const waitingProfiles = await db.select().from(profile).where(isNotNull(profile.newSnapshot))

    return c.json({
        message: "Waiting profiles",
        profiles: waitingProfiles
    })
})

app.post("/profiles", async (c) => {
    const user = c.get("user")
    if (!user || user.role !== "admin") {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const body = await c.req.json()
    const profileId = body.profileId
    const isApproved = body.isApproved

    if (isApproved) {
        const oldProfile = await db.select().from(profile).where(eq(profile.id, profileId))
        const snapshot: any = oldProfile[0].newSnapshot
        const newProfile = await db.update(profile).set({
            handle: snapshot.handle,
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
    const user = c.get("user")
    if (!user || user.role !== "admin") {
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

app.post("/tags", async (c) => {
    const user = c.get("user")
    if (!user || user.role !== "admin") {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

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
    const user = c.get("user")
    if (!user || user.role !== "admin") {
        return c.json({
            message: "Unauthorized"
        }, 401)
    }

    const tagId = c.req.param("tagId")
    await db.delete(tag).where(eq(tag.id, tagId))

    return c.json({
        message: "Tag deleted",
    })
})

export default app