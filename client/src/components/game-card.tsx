import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CalendarDays } from "lucide-react";
import type { Game } from "@/lib/api-types";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="group"
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
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {game.name}
                </h2>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    {Math.round(game.rating * 10) / 10}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(game.released).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </a>
      </Link>
    </motion.div>
  );
}