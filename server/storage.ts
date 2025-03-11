// Not needed for this implementation as we're directly using the RAWG API
import { type Game } from "@shared/schema";

export interface IStorage {
  // Placeholder interface since we're using external API
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
