import { pgTable, text, timestamp, boolean, integer, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    role: text('role').notNull().default('user'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const profile = pgTable("profile", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').default(''),
    handle: text('handle').notNull().unique(),
    gender: integer('gender').notNull().default(0),
    avatarUrl: text('avatar_url'),
    bannerUrl: text('banner_url'),
    statusMessage: text('status_message'),
    expertiseSummary: text('expertise_summary'),
    bio: text('bio'),
    backgroundDescription: text('background_description'),
    motivation: text('motivation'),
    expectations: text('expectations'),
    canOffer: text('can_offer'),
    wechat: text('wechat'),
    locationVisibility: integer('location_visibility').notNull().default(0),
    province: text('province'),
    city: text('city'),
    district: text('district'),
    newSnapshot: jsonb('new_snapshot'),
    extraData: jsonb('extra_data'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const userAvailability = pgTable("user_availability", {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    weekDay: integer('week_day').notNull(),
    timeSlot: integer('time_slot').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.userId, t.weekDay, t.timeSlot] }),
]);

export const tag = pgTable("tag", {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    category: text('category').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const userTag = pgTable("user_tag", {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.userId, t.tagId] }),
]);

export const message = pgTable("message", {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    receiverId: text('receiver_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
