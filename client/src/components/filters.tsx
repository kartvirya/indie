import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { Genre, GameFilters } from "@/lib/api-types";

interface FiltersProps {
  onFilterChange: (filters: GameFilters) => void;
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [rating, setRating] = useState([0]);

  const { data: genres, isLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
  });

  const handleGenreToggle = (genreSlug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreSlug)
        ? prev.filter((g) => g !== genreSlug)
        : [...prev, genreSlug]
    );
  };

  const applyFilters = () => {
    onFilterChange({
      genres: selectedGenres,
      minRating: rating[0],
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div>Loading genres...</div>
            ) : (
              genres?.map((genre) => (
                <Badge
                  key={genre.id}
                  variant={selectedGenres.includes(genre.slug) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleGenreToggle(genre.slug)}
                >
                  {genre.name}
                </Badge>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Minimum Rating</h3>
          <Slider
            value={rating}
            onValueChange={setRating}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            {rating[0]}%
          </div>
        </div>

        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
