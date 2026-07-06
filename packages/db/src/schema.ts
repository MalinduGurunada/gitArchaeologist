import { pgTable, uuid, text, timestamp, jsonb, vector, index, unique } from 'drizzle-orm/pg-core'

// ── Users ────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  githubId:  text('github_id').notNull().unique(),
  username:  text('username').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Projects ─────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  owner:     text('owner').notNull(),
  repo:      text('repo').notNull(),
  status:    text('status').notNull().default('pending'), // pending | ingesting | embedding | complete | failed
  error:     text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.userId, t.owner, t.repo)
])

// ── Chunks ───────────────────────────────────────────────────────
export const chunks = pgTable('chunks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),      // commit | pr | comment
  text:      text('text').notNull(),      // content that gets embedded
  sha:       text('sha'),                 // commit SHA or PR number
  author:    text('author'),
  date:      timestamp('date', { withTimezone: true }),
  url:       text('url'),                 // GitHub link
  metadata:  jsonb('metadata'),           // extra data
  embedding: vector('embedding', { dimensions: 768 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('chunks_project_idx').on(t.projectId),
  index('chunks_embedding_idx').using('ivfflat', t.embedding.op('vector_cosine_ops'))
])

// ── Types ────────────────────────────────────────────────────────
export type User         = typeof users.$inferSelect
export type NewUser      = typeof users.$inferInsert
export type Project      = typeof projects.$inferSelect
export type NewProject   = typeof projects.$inferInsert
export type Chunk        = typeof chunks.$inferSelect
export type NewChunk     = typeof chunks.$inferInsert