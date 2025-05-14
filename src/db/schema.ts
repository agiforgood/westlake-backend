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
    statusMessage: text('status_message'), // 状态消息
    expertiseSummary: text('expertise_summary'), // 我的专业背景介绍
    bio: text('bio'), // 一句话介绍自己
    achievements: text('achievements'), // 我干过哪些令人印象深刻的事情
    coreSkills: text('core_skills').array(),
    otherSocialIssues: text('other_social_issues'), // 我还想或正在解决哪些社会问题
    motivation: text('motivation'), // 我为什么选择加入智能向善社会创新网络
    expectations: text('expectations'), // 我的心愿清单或希望从智能向善网络获得的支持
    hobbies: text('hobbies'), // 我的其他兴趣爱好
    inspirations: text('inspirations'), // 我的思想和灵感的来源
    wechat: text('wechat'), // 联系方式（微信）
    locationVisibility: integer('location_visibility').notNull().default(0),
    province: text('province'),
    city: text('city'),
    district: text('district'),
    newSnapshot: jsonb('new_snapshot'),
    backgroundDescription: text('background_description'),
    canOffer: text('can_offer'),
    isVerified: boolean('is_verified').notNull().default(false),
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
