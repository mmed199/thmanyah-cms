export interface ContentMetadata {
  duration?: number; // seconds
  episodeNumber?: number;
  seasonNumber?: number;
  guests?: string[];
  thumbnailUrl?: string;
  [key: string]: unknown;
}
