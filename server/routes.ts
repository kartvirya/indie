import type { Express } from "express";
import { createServer } from "http";
import { z } from "zod";
import { gameFilters } from "@shared/schema";

const RAWG_API_KEY = process.env.RAWG_API_KEY || "";
const RAWG_BASE_URL = "https://api.rawg.io/api";

// List of major publishers/developers to exclude
const MAJOR_COMPANIES = [
  "Electronic Arts",
  "Ubisoft",
  "Activision",
  "Blizzard",
  "Take-Two Interactive",
  "2K Games",
  "Rockstar Games",
  "Square Enix",
  "Sony Interactive Entertainment",
  "Microsoft Game Studios",
  "Nintendo",
  "Bandai Namco",
  "Capcom",
  "SEGA",
  "THQ Nordic",
  "Warner Bros. Interactive",
  "505 Games",
  "Focus Home Interactive",
  "Devolver Digital",
];

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

      if (filters.minReviews) {
        queryParams.append("ratings_count", `${filters.minReviews},5000`);
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

      // Filter games by checking their developers
      let filteredGames = data.results;

      if (filters.independentOnly) {
        const detailedGames = await Promise.all(
          data.results.map(async (game: any) => {
            try {
              const gameDetailsResponse = await fetch(
                `${RAWG_BASE_URL}/games/${game.id}?key=${RAWG_API_KEY}`
              );

              if (!gameDetailsResponse.ok) return null;

              const gameDetails = await gameDetailsResponse.json();
              const developers = gameDetails.developers || [];
              
              console.log(`Game ${game.name} developers:`, developers.map((dev: any) => dev.name));
              
              // Check if any developer is in the major companies list
              const isIndependent = developers.length > 0 && 
                !developers.some((dev: any) => MAJOR_COMPANIES.includes(dev.name));
              
              return {
                game,
                isIndependent,
                hasDevelopers: developers.length > 0
              };
            } catch (error) {
              console.error(`Error fetching details for game ${game.id}:`, error);
              return null;
            }
          })
        );

        // Filter out games without developer info and non-indie games
        const validGames = detailedGames.filter(Boolean);
        console.log(`Found ${validGames.length} games with developer info`);
        
        const indieGames = validGames.filter(item => item.isIndependent && item.hasDevelopers);
        console.log(`Found ${indieGames.length} indie games after filtering`);
        
        filteredGames = indieGames.map(item => item.game);
      }

      if (!filteredGames.length) {
        return res.status(404).json({ 
          message: "No indie games found matching your criteria. Try adjusting your filters." 
        });
      }

      // Randomly select a game from the filtered results
      const randomIndex = Math.floor(Math.random() * filteredGames.length);
      const selectedGame = filteredGames[randomIndex];

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
        const errorText = await gameResponse.text();
        console.error("RAWG API Error:", errorText);
        throw new Error("Failed to fetch game details");
      }

      const game = await gameResponse.json();

      // Get genres, tags, and developers for better recommendations
      const genres = game.genres.map((g: any) => g.id).join(",");
      const tags = game.tags?.slice(0, 3).map((t: any) => t.id).join(",") || "";
      const developers = game.developers?.map((d: any) => d.id).join(",") || "";

      // Build query parameters for recommendations
      const queryParams = new URLSearchParams({
        key: RAWG_API_KEY,
        genres: genres,
        tags: tags,
        developers: developers,
        exclude_games: id,
        page_size: "4",
        ordering: "-rating",
        dates: "2015-01-01,2024-12-31", // Recent games
        platforms: "4", // PC games (Steam platform)
        metacritic: "70,100" // Good quality games
      });

      console.log("Fetching recommendations with params:", queryParams.toString());

      const recommendationsResponse = await fetch(
        `${RAWG_BASE_URL}/games?${queryParams.toString()}`
      );

      if (!recommendationsResponse.ok) {
        const errorText = await recommendationsResponse.text();
        console.error("RAWG API Error:", errorText);
        throw new Error("Failed to fetch recommendations");
      }

      const recommendations = await recommendationsResponse.json();
      res.json({
        results: recommendations.results,
        similarityFactors: {
          genres: game.genres.map((g: any) => g.name),
          tags: game.tags?.slice(0, 3).map((t: any) => t.name) || [],
          developers: game.developers?.map((d: any) => d.name) || []
        }
      });
    } catch (error) {
      console.error("Recommendation fetch error:", error);
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