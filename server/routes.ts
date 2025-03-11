import type { Express } from "express";
import { createServer } from "http";
import { z } from "zod";
import { gameFilters } from "@shared/schema";

const RAWG_API_KEY = process.env.RAWG_API_KEY || "";
const RAWG_BASE_URL = "https://api.rawg.io/api";

export async function registerRoutes(app: Express) {
  app.get("/api/games/random", async (req, res) => {
    try {
      const filters = gameFilters.parse(req.query);

      const response = await fetch(
        `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&page_size=40&tags=indie${
          filters.genres ? `&genres=${filters.genres.join(",")}` : ""
        }${filters.minRating ? `&metacritic=${filters.minRating},100` : ""}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch games from RAWG API");
      }

      const data = await response.json();
      const games = data.results;

      // Randomly select a game from the results
      const randomIndex = Math.floor(Math.random() * games.length);
      const selectedGame = games[randomIndex];

      res.json(selectedGame);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random game" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(
        `${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch game details");
      }

      const game = await response.json();
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game details" });
    }
  });

  app.get("/api/games/:id/recommendations", async (req, res) => {
    try {
      const { id } = req.params;
      const gameResponse = await fetch(
        `${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`
      );

      if (!gameResponse.ok) {
        throw new Error("Failed to fetch game details");
      }

      const game = await gameResponse.json();
      const genres = game.genres.map((g: any) => g.id).join(",");
      const tags = game.tags?.slice(0, 3).map((t: any) => t.id).join(",") || "";

      const recommendationsResponse = await fetch(
        `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&genres=${genres}&tags=${tags}&exclude_games=${id}&page_size=4&ordering=-rating`
      );

      if (!recommendationsResponse.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const recommendations = await recommendationsResponse.json();
      res.json(recommendations.results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/genres", async (_req, res) => {
    try {
      const response = await fetch(
        `${RAWG_BASE_URL}/genres?key=${RAWG_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }

      const data = await response.json();
      res.json(data.results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  return createServer(app);
}