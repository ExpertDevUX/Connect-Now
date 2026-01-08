import { db } from "./db";
import { rooms, type InsertRoom, type Room } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomBySlug(slug: string): Promise<Room | undefined>;
  getRooms(): Promise<Room[]>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const slug = insertRoom.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
    const [room] = await db.insert(rooms).values({ ...insertRoom, slug }).returning();
    return room;
  }

  async getRoomBySlug(slug: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug));
    return room;
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }
}

export const storage = new DatabaseStorage();
