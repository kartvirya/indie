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

      // Simplified query parameters for better results
      const queryParams = new URLSearchParams({
        key: RAWG_API_KEY,
        page_size: "20",
        dates: "2015-01-01,2024-12-31", // Recent games
        platforms: "4", // PC games (Steam platform)
      });

      // Add optional filters
      if (filters.genres?.length) {
        queryParams.append("genres", filters.genres.join(","));
      }

      if (filters.minRating) {
        queryParams.append("metacritic", `${filters.minRating},100`);
      }

      console.log("Fetching games with params:", queryParams.toString());

      const response = await fetch(
        `${RAWG_BASE_URL}/games?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("RAWG API Error:", errorText);
        throw new Error(`RAWG API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.results?.length || 0} games`);

      if (!data.results?.length) {
        // Try again without filters if no games found
        const fallbackParams = new URLSearchParams({
          key: RAWG_API_KEY,
          page_size: "20",
          dates: "2015-01-01,2024-12-31",
          platforms: "4",
        });

        const fallbackResponse = await fetch(
          `${RAWG_BASE_URL}/games?${fallbackParams.toString()}`
        );

        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch games, even with fallback options");
        }

        const fallbackData = await fallbackResponse.json();
        if (!fallbackData.results?.length) {
          return res.status(404).json({ 
            message: "No games found. Please try again." 
          });
        }

        data.results = fallbackData.results;
      }

      // Randomly select a game from the results
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const selectedGame = data.results[randomIndex];

      res.json(selectedGame);
    } catch (error) {
      console.error("Random game fetch error:", error);
      res.status(500).json({ 
        message: "Failed to fetch random game. Please try again." 
      });
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
        const errorText = await response.text();
        console.error("RAWG API Error:", errorText);
        throw new Error("Failed to fetch genres");
      }

      const data = await response.json();
      res.json(data.results);
    } catch (error) {
      console.error("Genre fetch error:", error);
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  return createServer(app);
}