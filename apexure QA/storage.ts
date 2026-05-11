import { db } from "./db";
import { comparisons, figmaFrames, webPages, type CreateComparisonInput, type Comparison, type InsertFigmaFrame, type FigmaFrame, type InsertWebPage, type WebPage } from "./shared/schema";
import { desc, eq } from "drizzle-orm";

// Helper: throws a clear error if DATABASE_URL is not configured
function getDb() {
  if (!db) throw new Error('Database is not configured. Please set the DATABASE_URL environment variable in Railway.');
  return db;
}

export interface IStorage {
  createComparison(comparison: CreateComparisonInput): Promise<Comparison>;
  getHistory(): Promise<Comparison[]>;
  saveFrame(frame: InsertFigmaFrame): Promise<FigmaFrame>;
  getFramesByFileKey(fileKey: string): Promise<FigmaFrame[]>;
  deleteFramesByFileKey(fileKey: string): Promise<void>;
  saveWebPage(page: InsertWebPage): Promise<WebPage>;
  getWebPageByUrl(url: string): Promise<WebPage | null>;
  deleteWebPageByUrl(url: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createComparison(input: CreateComparisonInput): Promise<Comparison> {
    const [comparison] = await getDb()
      .insert(comparisons)
      .values(input)
      .returning();
    return comparison;
  }

  async getHistory(): Promise<Comparison[]> {
    return await getDb()
      .select()
      .from(comparisons)
      .orderBy(desc(comparisons.createdAt));
  }

  async saveFrame(input: InsertFigmaFrame): Promise<FigmaFrame> {
    const [frame] = await getDb()
      .insert(figmaFrames)
      .values(input)
      .returning();
    return frame;
  }

  async getFramesByFileKey(fileKey: string): Promise<FigmaFrame[]> {
    return await getDb()
      .select()
      .from(figmaFrames)
      .where(eq(figmaFrames.fileKey, fileKey))
      .orderBy(figmaFrames.frameName);
  }

  async deleteFramesByFileKey(fileKey: string): Promise<void> {
    await getDb().delete(figmaFrames).where(eq(figmaFrames.fileKey, fileKey));
  }

  async saveWebPage(input: InsertWebPage): Promise<WebPage> {
    const [page] = await getDb()
      .insert(webPages)
      .values(input)
      .returning();
    return page;
  }

  async getWebPageByUrl(url: string): Promise<WebPage | null> {
    const results = await getDb()
      .select()
      .from(webPages)
      .where(eq(webPages.url, url))
      .orderBy(desc(webPages.createdAt))
      .limit(1);
    return results[0] || null;
  }

  async deleteWebPageByUrl(url: string): Promise<void> {
    await getDb().delete(webPages).where(eq(webPages.url, url));
  }
}

export const storage = new DatabaseStorage();
