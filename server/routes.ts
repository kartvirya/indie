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
      filters.independentOnly = true;

      // Simplified query parameters for better results
      const queryParams = new URLSearchParams({
        key: RAWG_API_KEY,
        page_size: "1000",
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
        `${RAWG_BASE_URL}/games?${queryParams.toString()}`,
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
          `${RAWG_BASE_URL}/games?${fallbackParams.toString()}`,
        );

        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch games, even with fallback options");
        }

        const fallbackData = await fallbackResponse.json();
        if (!fallbackData.results?.length) {
          return res.status(404).json({
            message: "No games found. Please try again.",
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
          page_size: "20",
          tags: "indie",
          platforms: "4",
        });
        
        // Add genres if specified
        if (filters.genres?.length) {
          indieParams.append("genres", filters.genres.join(","));
        }
        
        // Add rating filter if specified
        if (filters.minRating) {
          indieParams.append("metacritic", `${filters.minRating},100`);
        }

        console.log("Fetching indie games with params:", indieParams.toString());
        const indieResponse = await fetch(
          `${RAWG_BASE_URL}/games?${indieParams.toString()}`,
        );

        if (indieResponse.ok) {
          const indieData = await indieResponse.json();
          if (indieData.results?.length >= 5) {
            console.log(`Found ${indieData.results.length} games with indie tag`);
            filteredGames = indieData.results;
            // Skip the detailed check if we found enough games with the indie tag
          } else {
            console.log("Not enough indie games found with tag, doing detailed check");
            // Fall back to detailed developer check
            // Use a smaller batch of games for detailed processing
            const gamesToProcess = data.results.slice(0, 15); // Increase to 15 for better results
            console.log(
              `Processing ${gamesToProcess.length} games for indie filtering`,
            );

            const detailedGames = await Promise.all(
              gamesToProcess.map(async (game: any) => {
                try {
                  // Add a small delay to avoid rate limiting
                  await new Promise((resolve) => setTimeout(resolve, 100));

                  const gameDetailsResponse = await fetch(
                    `${RAWG_BASE_URL}/games/${game.id}?key=${RAWG_API_KEY}`,
                  );

                  if (!gameDetailsResponse.ok) {
                    console.error(
                      `Failed to fetch details for ${game.name}: ${gameDetailsResponse.status}`,
                    );
                    return null;
                  }

                  const gameDetails = await gameDetailsResponse.json();
                  const developers = gameDetails.developers || [];

                  const devNames = developers.map((dev: any) => dev.name);
                  console.log(
                    `Game "${game.name}" developers:`,
                    devNames.join(", ") || "None",
                  );

                  // Check if game has indie tag
                  const tags = gameDetails.tags || [];
                  const hasIndieTag = tags.some((tag: any) => tag.slug === 'indie');
                  
                  // A game is independent if it has indie tag OR (has developers and none are in the major companies list)
                  const isIndependent =
                    hasIndieTag || 
                    (developers.length > 0 &&
                    !developers.some((dev: any) =>
                      MAJOR_COMPANIES.includes(dev.name),
                    ));

                  if (isIndependent) {
                    console.log(`✅ "${game.name}" is INDIE`);
                  } else if (developers.length > 0) {
                    console.log(`❌ "${game.name}" is NOT indie`);
                  } else {
                    console.log(`⚠️ "${game.name}" has no developer info`);
                  }

                  return {
                    game,
                    isIndependent,
                    hasDevelopers: developers.length > 0 || hasIndieTag,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching details for game ${game.id}:`,
                    error,
                  );
                  return null;
                }
              }),
            );

            // Filter out games without developer info and non-indie games
            const validGames = detailedGames.filter(Boolean);
            console.log(`Found ${validGames.length} games with developer info`);

            const indieGames = validGames.filter(
              (item) => item.isIndependent
            );
            console.log(`Found ${indieGames.length} indie games after filtering`);

            if (indieGames.length > 0) {
              filteredGames = indieGames.map((item) => item.game);
              console.log(`Returning ${filteredGames.length} indie games`);
            } else {
              console.log("No indie games found, using games with indie tag as fallback");
              filteredGames = indieData.results || [];
            }
          }
        } else {
          // If indie tag request fails, fall back to original method
          console.log("Indie tag request failed, using developer-based filtering");
          // Use a smaller batch of games for detailed processing
          const gamesToProcess = data.results.slice(0, 15);
          console.log(
            `Processing ${gamesToProcess.length} games for indie filtering`,
          );

          const detailedGames = await Promise.all(
            gamesToProcess.map(async (game: any) => {
              try {
                // Add a small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100));

                const gameDetailsResponse = await fetch(
                  `${RAWG_BASE_URL}/games/${game.id}?key=${RAWG_API_KEY}`,
                );

                if (!gameDetailsResponse.ok) {
                  console.error(
                    `Failed to fetch details for ${game.name}: ${gameDetailsResponse.status}`,
                  );
                  return null;
                }

                const gameDetails = await gameDetailsResponse.json();
                const developers = gameDetails.developers || [];

                const devNames = developers.map((dev: any) => dev.name);
                console.log(
                  `Game "${game.name}" developers:`,
                  devNames.join(", ") || "None",
                );

                // A game is independent if it has developers and none are in the major companies list
                const isIndependent =
                  developers.length > 0 &&
                  !developers.some((dev: any) =>
                    MAJOR_COMPANIES.includes(dev.name),
                  );

                if (isIndependent) {
                  console.log(`✅ "${game.name}" is INDIE`);
                } else if (developers.length > 0) {
                  console.log(`❌ "${game.name}" is NOT indie`);
                } else {
                  console.log(`⚠️ "${game.name}" has no developer info`);
                }

                return {
                  game,
                  isIndependent,
                  hasDevelopers: developers.length > 0,
                };
              } catch (error) {
                console.error(
                  `Error fetching details for game ${game.id}:`,
                  error,
                );
                return null;
              }
            }),
          );

          // Filter out games without developer info and non-indie games
          const validGames = detailedGames.filter(Boolean);
          console.log(`Found ${validGames.length} games with developer info`);

          const indieGames = validGames.filter(
            (item) => item.isIndependent && item.hasDevelopers,
          );
          console.log(`Found ${indieGames.length} indie games after filtering`);

          if (indieGames.length > 0) {
            filteredGames = indieGames.map((item) => item.game);
            console.log(`Returning ${filteredGames.length} indie games`);
          }
        }
      }

      if (!filteredGames.length) {
        return res.status(404).json({
          message:
            "No indie games found matching your criteria. Try adjusting your filters.",
        });
      }

      // Randomly select a game from the filtered results
      const randomIndex = Math.floor(Math.random() * filteredGames.length);
      const selectedGame = filteredGames[randomIndex];

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
