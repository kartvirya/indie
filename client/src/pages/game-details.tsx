import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Game } from "@/lib/api-types";

export default function GameDetails() {
  const [, params] = useRoute("/game/:id");
  
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${params?.id}`],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <div className="aspect-video relative overflow-hidden">
            <img
              src={game.background_image}
              alt={game.name}
              className="object-cover w-full h-full"
            />
          </div>
          
          <CardHeader>
            <CardTitle className="text-3xl">{game.name}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary">
                Rating: {Math.round(game.rating * 10) / 10}
              </Badge>
              <Badge variant="secondary">
                Released: {new Date(game.released).toLocaleDateString()}
              </Badge>
              {game.metacritic && (
                <Badge variant="secondary">
                  Metacritic: {game.metacritic}
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <Badge key={genre.id}>{genre.name}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map(({ platform }) => (
                  <Badge key={platform.id} variant="outline">
                    {platform.name}
                  </Badge>
                ))}
              </div>
            </div>

            {game.description_raw && (
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {game.description_raw}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
