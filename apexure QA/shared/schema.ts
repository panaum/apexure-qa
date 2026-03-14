import { pgTable, serial, text, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── comparisons ───────────────────────────────────────────────────────────────
export const comparisons = pgTable("comparisons", {
    id: serial("id").primaryKey(),
    figmaUrl: text("figma_url").notNull(),
    liveUrl: text("live_url").notNull(),
    result: jsonb("result"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertComparisonSchema = createInsertSchema(comparisons).omit({
    id: true,
    createdAt: true,
});

export type CreateComparisonInput = z.infer<typeof insertComparisonSchema>;
export type Comparison = typeof comparisons.$inferSelect;

// ── figma_frames ──────────────────────────────────────────────────────────────
export const figmaFrames = pgTable("figma_frames", {
    id: serial("id").primaryKey(),
    fileKey: text("file_key").notNull(),
    frameId: text("frame_id").notNull(),
    frameName: text("frame_name").notNull(),
    width: real("width"),
    height: real("height"),
    elements: jsonb("elements"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFigmaFrameSchema = createInsertSchema(figmaFrames).omit({
    id: true,
    createdAt: true,
});

export type InsertFigmaFrame = z.infer<typeof insertFigmaFrameSchema>;
export type FigmaFrame = typeof figmaFrames.$inferSelect;

// ── web_pages ─────────────────────────────────────────────────────────────────
export const webPages = pgTable("web_pages", {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    content: jsonb("content"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWebPageSchema = createInsertSchema(webPages).omit({
    id: true,
    createdAt: true,
});

export type InsertWebPage = z.infer<typeof insertWebPageSchema>;
export type WebPage = typeof webPages.$inferSelect;
