import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GameCard from "./game-card";
import type { Game } from "@/lib/api-types";

interface GameRecommendationsProps {
  gameId: string;
}

export default function GameRecommendations({ gameId }: GameRecommendationsProps) {
  const { data: recommendations, isLoading } = useQuery<Game[]>({
    queryKey: [`/api/games/${gameId}/recommendations`],
  });

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground animate-pulse">
        Loading recommendations...
      </div>
    );
  }

  if (!recommendations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Similar Games You Might Like</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {recommendations.map((game, index) => (
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
