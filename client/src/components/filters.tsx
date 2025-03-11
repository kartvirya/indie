import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gamepad2, Star, Users } from "lucide-react";
import type { Genre, GameFilters } from "@/lib/api-types";

interface FiltersProps {
  onFilterChange: (filters: GameFilters) => void;
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [rating, setRating] = useState([0]);
  const [reviews, setReviews] = useState([0]);
  const [independentOnly, setIndependentOnly] = useState(true);

  const { data: genres, isLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
  });

  const handleGenreToggle = (genreSlug: string) => {
    const newGenres = selectedGenres.includes(genreSlug)
      ? selectedGenres.filter((g) => g !== genreSlug)
      : [...selectedGenres, genreSlug];

    setSelectedGenres(newGenres);
    updateFilters(newGenres, rating[0], reviews[0], independentOnly);
  };

  const handleRatingChange = (newRating: number[]) => {
    setRating(newRating);
    updateFilters(selectedGenres, newRating[0], reviews[0], independentOnly);
  };

  const handleReviewsChange = (newReviews: number[]) => {
    setReviews(newReviews);
    updateFilters(selectedGenres, rating[0], newReviews[0], independentOnly);
  };

  const handleIndependentChange = (checked: boolean) => {
    setIndependentOnly(checked);
    updateFilters(selectedGenres, rating[0], reviews[0], checked);
  };

  const updateFilters = (
    genres: string[],
    minRating: number,
    minReviews: number,
    independentOnly: boolean
  ) => {
    // Only include non-zero values to avoid filtering with zeros
    const filters: GameFilters = {
      genres: genres.length > 0 ? genres : undefined,
      independentOnly
    };
    
    if (minRating > 0) filters.minRating = minRating;
    if (minReviews > 0) filters.minReviews = minReviews;
    
    console.log("Applying filters:", filters);
    onFilterChange(filters);
  };

  const badgeVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  };

  return (
    <Card className="sticky top-4 backdrop-blur-sm bg-card/80 border-primary/20">
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <CardTitle>Game Filters</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your game discovery
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            Genres
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedGenres.length} selected
              </Badge>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading genres...
              </div>
            ) : (
              genres?.map((genre, index) => (
                <motion.div
                  key={genre.id}
                  variants={badgeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant={selectedGenres.includes(genre.slug) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleGenreToggle(genre.slug)}
                  >
                    {genre.name}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Star className="h-4 w-4" /> Minimum Rating
          </h3>
          <Slider
            value={rating}
            onValueChange={handleRatingChange}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            {rating[0]}% or higher
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" /> Minimum Reviews
          </h3>
          <Slider
            value={reviews}
            onValueChange={handleReviewsChange}
            max={1000}
            step={100}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            {reviews[0]}+ reviews
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="independent"
            checked={independentOnly}
            onCheckedChange={(checked) => handleIndependentChange(checked as boolean)}
          />
          <label
            htmlFor="independent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show only independent developers
          </label>
        </div>
      </CardContent>
    </Card>
  );
}