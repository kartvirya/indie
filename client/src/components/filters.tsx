import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gamepad2, Star, Users, Calendar } from "lucide-react";
import type { GameFilters } from "@/lib/api-types";

interface FiltersProps {
  onFilterChange: (filters: GameFilters) => void;
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [rating, setRating] = useState([0]);
  const [reviews, setReviews] = useState([0]);
  const [releaseYears, setReleaseYears] = useState([2015]); // Default to 2015 as minimum year

  const handleRatingChange = (newRating: number[]) => {
    setRating(newRating);
    updateFilters(newRating[0], reviews[0], releaseYears[0]);
  };

  const handleReviewsChange = (newReviews: number[]) => {
    setReviews(newReviews);
    updateFilters(rating[0], newReviews[0], releaseYears[0]);
  };

  const handleReleaseYearChange = (newYears: number[]) => {
    setReleaseYears(newYears);
    updateFilters(rating[0], reviews[0], newYears[0]);
  };

  const updateFilters = (
    minRating: number,
    minReviews: number,
    minReleaseYear: number
  ) => {
    // Always use just the "indie" genre
    const filters: GameFilters = {
      genres: ["indie"],
      independentOnly: true,
      minReleaseYear: minReleaseYear
    };

    if (minRating > 0) filters.minRating = minRating;
    if (minReviews > 0) filters.minReviews = minReviews;

    console.log("Applying filters:", filters);
    onFilterChange(filters);
  };

  useEffect(() => {
    // Apply default filters when component mounts
    setRating([60]);
    setReleaseYears([2015]);
    updateFilters(60, 0, 2015);
  }, []);

  return (
    <Card className="sticky top-4 backdrop-blur-sm bg-card/80 border-primary/20">
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <CardTitle>Game Filters</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your indie game discovery
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Release Year (and newer)
          </h3>
          <Slider
            value={releaseYears}
            onValueChange={handleReleaseYearChange}
            min={2000}
            max={2024}
            step={1}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            {releaseYears[0]} or newer
          </div>
        </div>
      </CardContent>
    </Card>
  );
}