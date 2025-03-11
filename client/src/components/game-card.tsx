import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    >
      <Link href={`/game/${game.id}`}>
        <a>
          <Card className="overflow-hidden hover:border-primary transition-colors">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={game.background_image}
                alt={game.name}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-2">{game.name}</h2>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">
                  Rating: {Math.round(game.rating * 10) / 10}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Released: {new Date(game.released).getFullYear()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre.id} variant="outline">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </a>
      </Link>
    </motion.div>
  );
}
