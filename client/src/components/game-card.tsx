import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CalendarDays, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/lib/api-types";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card link click

    try {
      await navigator.share({
        title: game.name,
        text: `Check out this indie game: ${game.name}`,
        url: window.location.origin + `/game/${game.id}`
      });
    } catch (err) {
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.origin + `/game/${game.id}`);
      toast({
        title: "Link copied!",
        description: "Game link has been copied to your clipboard."
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="group relative"
    >
      <Link href={`/game/${game.id}`}>
        <a className="block">
          <Card className="overflow-hidden transition-colors hover:bg-accent/5 border-primary/10">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={game.background_image}
                alt={game.name}
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                  {game.name}
                </h2>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
                    {Math.round(game.rating * 10) / 10}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 md:h-4 md:w-4" />
                    {new Date(game.released).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {game.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre.id}
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                  {game.genres.length > 3 && (
                    <Badge variant="outline" className="bg-muted">
                      +{game.genres.length - 3} more
                    </Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </a>
      </Link>
    </motion.div>
  );
}