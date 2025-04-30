import { pgTable, text, timestamp, boolean, integer, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    role: text('role'),
    banned: boolean('banned'),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    phoneNumber: text('phone_number').unique(),
    phoneNumberVerified: boolean('phone_number_verified')
});

export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by')
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at')
});

export const profile = pgTable("profile", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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