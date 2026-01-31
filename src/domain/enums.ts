// Domain Enums - Pure TypeScript, no framework dependencies

export enum ProgramType {
  PODCAST_SERIES = "podcast_series",
  DOCUMENTARY_SERIES = "documentary_series",
}

export enum ContentType {
  PODCAST_EPISODE = "podcast_episode",
  DOCUMENTARY_EPISODE = "documentary_episode",
  STANDALONE_VIDEO = "standalone_video",
}

export enum Category {
  TECHNOLOGY = "technology",
  CULTURE = "culture",
  BUSINESS = "business",
  SOCIETY = "society",
  ENTERTAINMENT = "entertainment",
}

export enum Status {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum Source {
  MANUAL = "manual",
  YOUTUBE = "youtube",
  RSS = "rss",
}
