import type { Express } from "express";
import { createServer } from "http";
import { z } from "zod";
import { gameFilters } from "@shared/schema";

const RAWG_API_KEY = "6340d05733ef4c4cb00d2d337f150e7d";
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
      const filters = gameFilters.parse({
        genres: req.query.genres ? JSON.parse(req.query.genres as string) : ["indie"],
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        minReviews: req.query.minReviews ? Number(req.query.minReviews) : undefined,
        minReleaseYear: req.query.minReleaseYear ? Number(req.query.minReleaseYear) : undefined,
        independentOnly: req.query.independentOnly ? req.query.independentOnly === 'true' : true,
      });
      filters.independentOnly = true;

      // Log the filters being applied
      console.log("Received filters from client:", filters);

      // Format dates properly
      const selectedYear = filters.minReleaseYear || 2015;
      // Set both start and end date to the same year to get games specifically from that year
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      // Log the date range
      console.log("Using date range for API query:", { startDate, endDate, selectedYear });

      // Set default minimum values for ratings and reviews
      const minRating = Math.max(2, filters.minRating || 2);
      const minReviews = Math.max(100, filters.minReviews || 100);

      // Simplified query parameters for better results
      const queryParams = new URLSearchParams({
        key: RAWG_API_KEY,
        page_size: "100",
        dates: `${startDate},${endDate}`,
        platforms: "4",
        ordering: "-rating",
        metacritic: `${minRating},100`,
        ratings_count: `${minReviews}`
      });

      // Add genres filter
      if (filters.genres?.length) {
        queryParams.set("genres", filters.genres.join(","));
      }

      // Log the full URL being called
      const apiUrl = `${RAWG_BASE_URL}/games?${queryParams.toString()}`;
      console.log("Full API URL being called:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("RAWG API Error:", errorText);
        throw new Error(`RAWG API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.results?.length || 0} games`);

      if (!data.results?.length) {
        // Try again with slightly relaxed filters if no games found
        const fallbackParams = new URLSearchParams({
          key: RAWG_API_KEY,
          page_size: "20",
          dates: `${startDate},${endDate}`,
          platforms: "4",
          ordering: "-rating",
          metacritic: `${Math.max(1, minRating - 1)},100`, // Slightly lower rating requirement
          ratings_count: `${Math.max(50, minReviews - 50)}` // Slightly lower review requirement
        });

        // Only include essential filters in fallback
        if (filters.genres?.length) {
          fallbackParams.set("genres", filters.genres.join(","));
        }

        const fallbackResponse = await fetch(
          `${RAWG_BASE_URL}/games?${fallbackParams.toString()}`,
        );

        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch games, even with fallback options");
        }

        const fallbackData = await fallbackResponse.json();
        if (!fallbackData.results?.length) {
          return res.status(404).json({
            message: "No games found matching your criteria. Try adjusting your filters.",
          });
        }

        data.results = fallbackData.results;
      }

      // Filter games by checking their developers
      let filteredGames = data.results;

      if (filters.independentOnly) {
        console.log("Independent only filter is ON");

        // First, try directly with indie tag to improve efficiency
        const indieParams = new URLSearchParams({
          key: RAWG_API_KEY,
          page_size: "100",
          tags: "indie",
          platforms: "4",
          dates: `${startDate},${endDate}`,
          ordering: "-rating",
          metacritic: `${Math.max(1, minRating - 10)},100`, // Slightly relaxed rating for more results
          ratings_count: `${Math.max(50, minReviews - 50)}` // Slightly relaxed reviews for more results
        });

        // Add genres if specified
        if (filters.genres?.length) {
          indieParams.set("genres", filters.genres.join(","));
        }

        console.log("Fetching indie games with URL:", `${RAWG_BASE_URL}/games?${indieParams.toString()}`);
        const indieResponse = await fetch(
          `${RAWG_BASE_URL}/games?${indieParams.toString()}`,
        );

        if (indieResponse.ok) {
          const indieData = await indieResponse.json();
          if (indieData.results?.length > 0) {
            console.log(`Found ${indieData.results.length} games with indie tag`);
            // Filter games by all criteria
            const matchingGames = indieData.results.filter((game: { 
              released: string;
              rating: number;
              ratings_count: number;
            }) => {
              const year = new Date(game.released).getFullYear();
              const rating = Math.round(game.rating * 10);
              const reviews = game.ratings_count;
              
              return year === selectedYear && 
                     (!filters.minRating || rating >= filters.minRating) &&
                     (!filters.minReviews || reviews >= filters.minReviews);
            });
            
            if (matchingGames.length > 0) {
              console.log(`Found ${matchingGames.length} games matching all criteria`);
              filteredGames = matchingGames;
            } else {
              console.log("No games found matching all criteria, falling back to all indie games");
              filteredGames = indieData.results;
            }
          } else {
            console.log("No indie games found with tag, trying with relaxed filters");
            // Try again with more relaxed filters
            indieParams.set('metacritic', '1,100');
            indieParams.set('ratings_count', '1');
            
            const relaxedResponse = await fetch(
              `${RAWG_BASE_URL}/games?${indieParams.toString()}`,
            );
            
            if (relaxedResponse.ok) {
              const relaxedData = await relaxedResponse.json();
              if (relaxedData.results?.length > 0) {
                const yearFilteredGames = relaxedData.results.filter((game: { released: string }) => 
                  new Date(game.released).getFullYear() === selectedYear
                );
                
                if (yearFilteredGames.length > 0) {
                  console.log(`Found ${yearFilteredGames.length} games with relaxed filters for year ${selectedYear}`);
                  filteredGames = yearFilteredGames;
                } else {
                  filteredGames = relaxedData.results;
                }
              }
            }
          }
        }
      }

      if (!filteredGames.length) {
        return res.status(404).json({
          message: "No games found matching your criteria. Try adjusting your filters.",
        });
      }

      // Randomly select a game from the filtered results
      const randomIndex = Math.floor(Math.random() * filteredGames.length);
      const selectedGame = filteredGames[randomIndex];

      // Verify the game matches all our filters (year, rating, and reviews)
      const gameReleaseYear = new Date(selectedGame.released).getFullYear();
      const gameRating = Math.round(selectedGame.rating * 10); // Convert to percentage
      const gameReviews = selectedGame.ratings_count;

      console.log("Selected game info:", {
        gameName: selectedGame.name,
        releaseDate: selectedGame.released,
        releaseYear: gameReleaseYear,
        expectedYear: selectedYear,
        rating: gameRating,
        expectedRating: filters.minRating,
        reviews: gameReviews,
        expectedReviews: filters.minReviews
      });

      // Check if the game matches all our criteria
      const matchesYear = gameReleaseYear === selectedYear;
      const matchesRating = !filters.minRating || gameRating >= filters.minRating;
      const matchesReviews = !filters.minReviews || gameReviews >= filters.minReviews;

      if (!matchesYear || !matchesRating || !matchesReviews) {
        console.log("Game doesn't match all filters, trying to find another game");
        const matchingGames = filteredGames.filter((game: { 
          released: string;
          rating: number;
          ratings_count: number;
        }) => {
          const year = new Date(game.released).getFullYear();
          const rating = Math.round(game.rating * 10);
          const reviews = game.ratings_count;
          
          return year === selectedYear && 
                 (!filters.minRating || rating >= filters.minRating) &&
                 (!filters.minReviews || reviews >= filters.minReviews);
        });

        if (matchingGames.length > 0) {
          const newRandomIndex = Math.floor(Math.random() * matchingGames.length);
          console.log(`Found ${matchingGames.length} games matching all criteria`);
          res.json(matchingGames[newRandomIndex]);
          return;
        } else {
          console.log("No games found matching all criteria exactly, using best match");
        }
      }

      res.json(selectedGame);
    } catch (error) {
      console.error("Random game fetch error:", error);
      res.status(500).json({
        message: "Failed to fetch random game. Please try again.",
      });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(
        `${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`,
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
        `${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`,
      );

      if (!gameResponse.ok) {
        const errorText = await gameResponse.text();
        console.error("RAWG API Error:", errorText);
        throw new Error("Failed to fetch game details");
      }

      const game = await gameResponse.json();

      // Get genres, tags, and developers for better recommendations
      const genres = game.genres.map((g: any) => g.id).join(",");
      const tags =
        game.tags
          ?.slice(0, 3)
          .map((t: any) => t.id)
          .join(",") || "";
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
        metacritic: "70,100", // Good quality games
      });

      console.log(
        "Fetching recommendations with params:",
        queryParams.toString(),
      );

      const recommendationsResponse = await fetch(
        `${RAWG_BASE_URL}/games?${queryParams.toString()}`,
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
          developers: game.developers?.map((d: any) => d.name) || [],
        },
      });
    } catch (error) {
      console.error("Recommendation fetch error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/genres", async (_req, res) => {
    try {
      const response = await fetch(
        `${RAWG_BASE_URL}/genres?key=${RAWG_API_KEY}`,
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
