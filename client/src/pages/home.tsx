import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch random game. Please try again.",
      });
    }
  }, [error, toast]);

  const handleRandomize = () => {
    refetch();
  };

  const handleFilterChange = (newFilters: GameFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-accent/5">
      <div className="max-w-4xl mx-auto text-center mb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Find Your Next Indie Game
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover hidden gems in the indie game world
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-[300px,1fr] gap-8 px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Filters onFilterChange={handleFilterChange} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <Button
            size="lg"
            onClick={handleRandomize}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <Dice6 className="mr-2 h-6 w-6" />
            {isLoading ? "Finding a game..." : "Find Random Game"}
          </Button>

          {game && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <GameCard game={game} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}