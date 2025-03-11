import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GameRecommendations from "@/components/game-recommendations";
import type { Game } from "@/lib/api-types";

export default function GameDetails() {
  const [, params] = useRoute("/game/:id");
  const { toast } = useToast();

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${params?.id}`],
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: game?.name || "Indie Game",
        text: `Check out this indie game: ${game?.name}`,
        url: window.location.href
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Game link has been copied to your clipboard."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-[400px] bg-muted rounded" />
      </div>
    );
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <Card>
          <div className="aspect-[21/9] sm:aspect-[2/1] md:aspect-video relative overflow-hidden">
            <img
              src={game.background_image}
              alt={game.name}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl">{game.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="text-sm md:text-base">
                Rating: {Math.round(game.rating * 10) / 10}
              </Badge>
              <Badge variant="secondary" className="text-sm md:text-base">
                Released: {new Date(game.released).toLocaleDateString()}
              </Badge>
              {game.metacritic && (
                <Badge variant="secondary" className="text-sm md:text-base">
                  Metacritic: {game.metacritic}
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <Badge key={genre.id} className="text-sm md:text-base">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map(({ platform }) => (
                  <Badge key={platform.id} variant="outline" className="text-sm md:text-base">
                    {platform.name}
                  </Badge>
                ))}
              </div>
            </div>

            {game.description_raw && (
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-line text-sm md:text-base leading-relaxed">
                  {game.description_raw}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {params?.id && <GameRecommendations gameId={params.id} />}
      </motion.div>
    </div>
  );
}