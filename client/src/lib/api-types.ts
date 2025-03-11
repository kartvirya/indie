export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Game {
  id: number;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  genres: Genre[];
  description_raw?: string;
  metacritic: number;
  platforms: Array<{
    platform: {
      id: number;
      name: string;
    };
  }>;
}

export interface GameFilters {
  genres?: string[];
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
}
