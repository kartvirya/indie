import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GameCard from "@/components/game-card";
import Filters from "@/components/filters";
import type { Game, GameFilters } from "@/lib/api-types";

export default function Home() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<GameFilters>({});
  
  const {
    data: game,
    refetch,
    isLoading,
    error
  } = useQuery<Game>({
    queryKey: ["/api/games/random", filters],
    enabled: false,
  });

  const handleRandomize = () => {
    refetch();
  };

  const handleFilterChange = (newFilters: GameFilters) => {
    setFilters(newFilters);
  };

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to fetch random game. Please try again.",
    });
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-4"
        >
          Find Your Next Indie Game
        </motion.h1>
        <p className="text-muted-foreground mb-8">
          Let us help you discover amazing indie games on Steam
        </p>
      </div>

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <Filters onFilterChange={handleFilterChange} />
        
        <div className="space-y-8">
          <Button
            size="lg"
            onClick={handleRandomize}
            disabled={isLoading}
            className="w-full"
          >
            <Dice6 className="mr-2 h-5 w-5" />
            {isLoading ? "Finding a game..." : "Randomize"}
          </Button>

          {game && <GameCard game={game} />}
        </div>
      </div>
    </div>
  );
}
