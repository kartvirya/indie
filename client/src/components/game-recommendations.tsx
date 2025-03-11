import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import GameCard from "./game-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@/lib/api-types";

interface RecommendationResponse {
  results: Game[];
  similarityFactors: {
    genres: string[];
    tags: string[];
    developers: string[];
  };
}

interface GameRecommendationsProps {
  gameId: string;
}

export default function GameRecommendations({ gameId }: GameRecommendationsProps) {
  const { data, isLoading, error } = useQuery<RecommendationResponse>({
    queryKey: [`/api/games/${gameId}/recommendations`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Similar Games You Might Like</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load recommendations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.results.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Similar Games You Might Like</h2>
        <p className="text-muted-foreground">
          Based on {data.similarityFactors.genres.join(", ")} games
          {data.similarityFactors.developers.length > 0 && 
            ` from ${data.similarityFactors.developers.join(", ")}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {data.results.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <GameCard game={game} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}