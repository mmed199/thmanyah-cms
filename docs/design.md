# Thmanyah Content Management & Discovery System

## Design Document

**Author:** Mohammed Moussaoui  
**Date:** January 31, 2026  
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Model](#data-model)
5. [Module Design](#module-design)
6. [API Design](#api-design)
7. [Event-Driven Communication](#event-driven-communication)
8. [Scalability Strategy](#scalability-strategy)
9. [Project Structure](#project-structure)
10. [Trade-offs & Alternatives](#trade-offs--alternatives)

---

## Overview

### Objective

Build a two-component system that stores and displays program episodes for users:

1. **Content Management System (CMS)** — Internal system for editors to manage content
2. **Discovery System** — Public-facing search and browse functionality

### Requirements

- Handle up to **10 million users/hour** (~2,800 req/sec)
- Support multiple content types (podcasts, documentaries)
- Enable future import from external sources (YouTube, RSS)
- Follow SOLID principles with low coupling and clear module boundaries

### Design Philosophy

This design prioritizes **clean architecture** and **demonstrable competency** over production-scale infrastructure. We deliberately simplify infrastructure while maintaining proper architectural boundaries — showing we know when NOT to over-engineer.

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients["👥 Clients"]
        Editors["✏️ Editors<br>(Internal)"]
        Users["🌍 Public Users<br>(10M/hour)"]
    end

    subgraph Application["🏗️ NestJS Modular Monolith"]
        subgraph CMS["📝 CMS Module"]
            CMSRepos["Repositories"]
            CMSAPI["REST API"]
        end
        subgraph Discovery["🔍 Discovery Module"]
            DiscRepos["Repositories"]
            DiscAPI["GraphQL API"]
        end
        subgraph Ingestion["📥 Ingestion Module"]
            IngRepos["Repositories"]
            IngStrat["Import Strategies"]
        end
        Shared["📦 Shared<br>(Entities, Events, Enums)"]
    end

    subgraph Infrastructure["⚙️ Infrastructure"]
        PG[("🐘 PostgreSQL<br>Source of Truth<br>+ Full-Text Search")]
        Redis[("🔴 Redis<br>Cache Layer")]
    end

    Editors --> CMSAPI
    Users --> DiscAPI

    CMSAPI --> CMSRepos
    CMSRepos --> Shared
    CMSRepos --> PG

    DiscAPI --> DiscRepos
    DiscRepos --> Shared
    DiscRepos --> PG
    DiscRepos --> Redis

    IngStrat --> IngRepos
    IngRepos --> Shared
    IngRepos --> PG

    style Editors fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style Users fill:#ffd166,stroke:#d4a012,color:#6b5900
    style CMS fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Discovery fill:#b197fc,stroke:#7048e8,color:#3b1d8f
    style Shared fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style Ingestion fill:#ffa94d,stroke:#e67700,color:#7c2d12
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
    style Redis fill:#ff6b6b,stroke:#c92a2a,color:#7f1d1d
```

---

## Architecture

### Pattern: Modular Monolith with Clean Architecture

We chose a **modular monolith** with **clean architecture principles** to:

- Avoid premature distributed systems complexity
- Maintain clear module boundaries within a single deployable unit
- Keep the domain layer pure and framework-agnostic
- Enable future extraction to microservices if needed

### SOLID Compliance

| Principle                     | Implementation                                         |
| ----------------------------- | ------------------------------------------------------ |
| **S** — Single Responsibility | Each module has one reason to change                   |
| **O** — Open/Closed           | Import strategies extensible without modification      |
| **L** — Liskov Substitution   | Repository adapters can be swapped (test/prod)         |
| **I** — Interface Segregation | Each module defines only the interfaces it needs       |
| **D** — Dependency Inversion  | Modules depend on their own ports, not implementations |

### Key Architectural Decisions

| Decision           | Choice                                | Rationale                                        |
| ------------------ | ------------------------------------- | ------------------------------------------------ |
| Architecture Style | Modular Monolith + Clean Architecture | Simpler ops, clear boundaries, testable domain   |
| Communication      | In-process EventEmitter               | No external messaging infrastructure needed      |
| CQRS-lite          | CMS (writes) / Discovery (reads)      | Optimize each path independently                 |
| Search             | PostgreSQL Full-Text Search           | Sufficient for scope, one less service to manage |
| Caching            | Redis                                 | Industry standard, simple key-value with TTL     |

### Module Boundaries & Dependency Flow

Each module is **self-contained** with its own repositories (interfaces + implementations), achieving true loose coupling:

```mermaid
flowchart TB
    subgraph Shared["📦 Shared (no business logic)"]
        Entities["📦 Domain Entities"]
        Enums["🏷️ Enums"]
        Events["📤 Domain Events"]
        ORM["🗄️ ORM Entities"]
    end

    subgraph CMS["📝 CMS Module (Self-Contained)"]
        CMSRepos["📁 repositories/<br>(*.interface.ts + *.ts)"]
        CMSControllers["🎮 Controllers"]
    end

    subgraph Discovery["🔍 Discovery Module (Self-Contained)"]
        DiscRepos["📁 repositories/<br>(*.interface.ts + *.ts)"]
        DiscResolvers["📊 Resolvers"]
    end

    subgraph Ingestion["📥 Ingestion Module (Self-Contained)"]
        IngRepos["📁 repositories/<br>(*.interface.ts + *.ts)"]
        IngServices["🔧 Services"]
    end

    subgraph External["🌐 External"]
        PG[("🐘 PostgreSQL")]
        Redis[("🔴 Redis")]
    end

    CMSControllers --> CMSRepos
    CMSRepos --> ORM
    CMSRepos --> Entities

    DiscResolvers --> DiscRepos
    DiscRepos --> ORM
    DiscRepos --> Entities

    IngServices --> IngRepos
    IngRepos --> ORM
    IngRepos --> Entities

    ORM --> PG
    DiscRepos --> Redis

    style CMS fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Discovery fill:#b197fc,stroke:#7048e8,color:#3b1d8f
    style Ingestion fill:#ffa94d,stroke:#e67700,color:#7c2d12
    style Shared fill:#e9ecef,stroke:#868e96,color:#495057
    style Entities fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style Events fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style Enums fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style ORM fill:#69db7c,stroke:#2f9e44,color:#14532d
    style PG fill:#e9ecef,stroke:#868e96,color:#495057
    style Redis fill:#e9ecef,stroke:#868e96,color:#495057
```

### Dependency Rule

> **Modules are self-contained and don't depend on each other.**

- Each module owns its **repositories/** folder with interfaces and implementations
- `*.interface.ts` files define the contract (with injection tokens)
- `*.ts` files provide the implementation
- `shared/` contains only: entities, enums, events, ORM entities (no business logic)
- Modules can be extracted to microservices independently

**What Each Module Owns:**

| Module        | Repository Interfaces                                       | Purpose                  |
| ------------- | ----------------------------------------------------------- | ------------------------ |
| **CMS**       | `ICmsContentRepository`, `ICmsProgramRepository`            | Full CRUD operations     |
| **Discovery** | `IDiscoveryContentReader`, `IDiscoveryProgramReader`, `IDiscoveryCache` | Read-only + caching      |
| **Ingestion** | `IIngestionContentWriter`, `IIngestionProgramRepository`, `IIngestionEventPublisher`              | Write + event publishing |

---

## Technology Stack

| Layer             | Technology           | Purpose                              |
| ----------------- | -------------------- | ------------------------------------ |
| **Runtime**       | Node.js + TypeScript | Type safety, ecosystem               |
| **Framework**     | NestJS               | Modular architecture, DI, decorators |
| **Database**      | PostgreSQL           | Source of truth, relational model    |
| **Search**        | PostgreSQL Full-Text | Full-text search with GIN index      |
| **Caching**       | Redis                | Low-latency key-value caching        |
| **Events**        | NestJS EventEmitter  | In-process domain event publishing   |
| **CMS API**       | REST                 | Standard CRUD operations             |
| **Discovery API** | GraphQL              | Flexible queries for frontend        |

### Simplification Rationale

| Original Choice | Simplified To      | Why                                   |
| --------------- | ------------------ | ------------------------------------- |
| NATS JetStream  | EventEmitter       | No external messaging infra needed    |
| Elasticsearch   | PostgreSQL FTS     | One less service, sufficient for demo |
| NATS KV         | Redis              | Standard, well-known cache solution   |
| Protobuf        | TypeScript classes | No code generation, simpler DX        |

---

## Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    Program ||--o{ Content : "has many 📚"

    Program["📺 Program"] {
        uuid id PK "🔑"
        string title "📌"
        text description "📝"
        enum type "🎭 podcast_series | documentary_series"
        enum category "🏷️"
        string language "🌐"
        enum status "📊 draft | published | archived"
        jsonb metadata "⚙️"
        timestamp created_at "📅"
        timestamp updated_at "🔄"
    }

    Content["🎬 Content"] {
        uuid id PK "🔑"
        uuid program_id FK "🔗 nullable"
        string title "📌"
        text description "📝"
        enum type "🎭 podcast_episode | documentary_episode | standalone_video"
        enum category "🏷️"
        string language "🌐"
        enum status "📊 draft | published | archived"
        enum source "📥 manual | youtube | rss"
        string external_id "🆔 nullable, unique"
        jsonb metadata "⚙️"
        tsvector search_vector "🔍 generated"
        timestamp published_at "🚀 nullable"
        timestamp created_at "📅"
        timestamp updated_at "🔄"
    }
```

### Full-Text Search Column

The `search_vector` column enables PostgreSQL full-text search:

```sql
-- Generated column for full-text search
ALTER TABLE content ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))
  ) STORED;

-- GIN index for fast search
CREATE INDEX idx_content_search ON content USING GIN(search_vector);
```

### Enums

```typescript
enum ProgramType {
  PODCAST_SERIES = "podcast_series",
  DOCUMENTARY_SERIES = "documentary_series",
}

enum ContentType {
  PODCAST_EPISODE = "podcast_episode",
  DOCUMENTARY_EPISODE = "documentary_episode",
  STANDALONE_VIDEO = "standalone_video",
}

enum Category {
  TECHNOLOGY = "technology",
  CULTURE = "culture",
  BUSINESS = "business",
  SOCIETY = "society",
  ENTERTAINMENT = "entertainment",
}

enum Status {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

enum Source {
  MANUAL = "manual",
  YOUTUBE = "youtube",
  RSS = "rss",
}
```

### Metadata Schema (JSONB)

Type-specific fields are stored in the `metadata` column for extensibility:

```typescript
// Podcast/Documentary episode metadata
interface VideoMetadata {
  duration: number; // seconds
  episodeNumber?: number;
  seasonNumber?: number;
  guests?: string[];
}

// Future: Newsletter metadata
interface NewsletterMetadata {
  readingTime: number; // minutes
  issueNumber: number;
}
```

### Design Rationale

- **Program → Content hierarchy**: Reflects real-world structure (series have episodes)
- **`programId` is nullable**: Supports standalone content without a series
- **JSONB metadata**: Enables extensibility without schema migrations
- **Enum for categories**: Type-safe, sufficient for current needs

---

## Module Design

### Shared Layer (No Business Logic)

Contains reusable types that all modules can import. **No business logic, no services.**

```
shared/
├── entities/               # Pure domain entities (Program, Content)
│   └── metadata/           # Metadata interfaces
├── enums/                  # ContentType, Category, Status, etc.
├── events/                 # Typed domain events
│   ├── content/            # Content lifecycle events
│   └── program/            # Program lifecycle events
└── persistence/
    └── entities/           # TypeORM ORM entities (DB mapping)
```

**Domain Entities (Pure Classes):**

```typescript
// shared/entities/content.entity.ts - Pure domain entity, no decorators
export class Content {
  constructor(props: CreateContentProps) {
    // ...
  }

  publish(): void {
    if (this.status === Status.ARCHIVED) {
      throw new Error("Cannot publish archived content");
    }
    this.status = Status.PUBLISHED;
    this.publishedAt = new Date();
  }

  archive(): void {
    this.status = Status.ARCHIVED;
  }
}
```

### CMS Module (Self-Contained)

Full CRUD operations for content editors. Defines its own ports and adapters.

```
cms/
├── ports/
│   ├── content.repository.port.ts   # ICmsContentRepository
│   └── program.repository.port.ts   # ICmsProgramRepository
├── adapters/
│   ├── content.repository.adapter.ts
│   └── program.repository.adapter.ts
├── controllers/
│   ├── program.controller.ts
│   └── content.controller.ts
├── dto/
└── cms.module.ts
```

**CMS Port (Only What CMS Needs):**

```typescript
// cms/ports/content.repository.port.ts
export const CMS_CONTENT_REPOSITORY = Symbol("CMS_CONTENT_REPOSITORY");

export interface ICmsContentRepository {
  save(content: Content): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  findAll(filter: ContentFilter, pagination: PaginationOptions): Promise<PaginatedResult<Content>>;
  delete(id: string): Promise<boolean>;
}
```

**CMS Adapter (Implements CMS Port):**

```typescript
// cms/adapters/content.repository.adapter.ts
@Injectable()
export class CmsContentRepositoryAdapter implements ICmsContentRepository {
  constructor(
    @InjectRepository(ContentOrmEntity)
    private readonly ormRepo: Repository<ContentOrmEntity>,
  ) {}

  async save(content: Content): Promise<Content> {
    /* ... */
  }
  async findById(id: string): Promise<Content | null> {
    /* ... */
  }
  // Only methods CMS needs!
}
```

### Discovery Module (Self-Contained)

Read-only GraphQL API with caching. Defines its own ports for reading and caching.

```
discovery/
├── ports/
│   ├── content.reader.port.ts       # IContentReader (read-only!)
│   ├── program.reader.port.ts       # IProgramReader (read-only!)
│   └── cache.port.ts                # ICachePort
├── adapters/
│   ├── content.reader.adapter.ts
│   ├── program.reader.adapter.ts
│   └── redis-cache.adapter.ts
├── resolvers/
│   ├── program.resolver.ts
│   ├── content.resolver.ts
│   └── search.resolver.ts
├── services/
│   ├── search.service.ts            # PostgreSQL full-text search
│   └── cache.service.ts             # Cache orchestration
└── discovery.module.ts
```

**Discovery Port (Read-Only):**

```typescript
// discovery/ports/content.reader.port.ts
export const CONTENT_READER = Symbol("CONTENT_READER");

export interface IContentReader {
  findById(id: string): Promise<Content | null>;
  findPublished(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;
  search(query: string, filters: SearchFilters): Promise<SearchResult>;
  // No save(), no delete() - Discovery doesn't need them!
}
```

### Ingestion Module (Self-Contained)

Import content from external sources. Defines its own ports for writing and event publishing.

```
ingestion/
├── ports/
│   ├── content.writer.port.ts       # IContentWriter
│   └── event-publisher.port.ts      # IEventPublisher
├── adapters/
│   ├── content.writer.adapter.ts
│   └── event-emitter.adapter.ts
├── strategies/
│   ├── import.strategy.ts           # Strategy interface
│   └── mock-youtube.strategy.ts
├── services/
│   └── ingestion.service.ts
└── ingestion.module.ts
```

**Ingestion Port (Write-Focused):**

```typescript
// ingestion/ports/content.writer.port.ts
export const CONTENT_WRITER = Symbol("CONTENT_WRITER");

export interface IContentWriter {
  save(content: Content): Promise<Content>;
  findByExternalId(source: Source, externalId: string): Promise<Content | null>;
  // No findAll(), no delete() - Ingestion doesn't need them!
}
```

**Strategy Pattern for Import:**

```typescript
// ingestion/strategies/import.strategy.ts
export interface ImportStrategy {
  readonly source: Source;
  import(input: ImportInput): Promise<ImportResult>;
}

// ingestion/strategies/mock-youtube.strategy.ts
@Injectable()
export class MockYouTubeStrategy implements ImportStrategy {
  readonly source = Source.YOUTUBE;

  constructor(
    @Inject(CONTENT_WRITER) private readonly contentWriter: IContentWriter,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
  ) {}

  async import(input: YouTubeImportInput): Promise<ImportResult> {
    // Idempotent import using findByExternalId
  }
}
```

**Search Service (PostgreSQL Full-Text):**

```typescript
// discovery/services/search.service.ts
@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ContentEntity)
    private readonly contentRepo: Repository<ContentEntity>,
  ) {}

  async search(
    query: string,
    filters: SearchFilters,
    pagination: Pagination,
  ): Promise<SearchResult> {
    const start = Date.now();

    const qb = this.contentRepo
      .createQueryBuilder("c")
      .where("c.status = :status", { status: Status.PUBLISHED });

    // Full-text search
    if (query) {
      qb.andWhere(`c.search_vector @@ plainto_tsquery('simple', :query)`, { query }).orderBy(
        `ts_rank(c.search_vector, plainto_tsquery('simple', :query))`,
        "DESC",
      );
    }

    // Apply filters
    if (filters.category) qb.andWhere("c.category = :category", { category: filters.category });
    if (filters.type) qb.andWhere("c.type = :type", { type: filters.type });
    if (filters.language) qb.andWhere("c.language = :lang", { lang: filters.language });
    if (filters.publishedAfter)
      qb.andWhere("c.publishedAt >= :after", { after: filters.publishedAfter });
    if (filters.publishedBefore)
      qb.andWhere("c.publishedAt <= :before", { before: filters.publishedBefore });

    // Pagination
    qb.skip(pagination.offset).take(pagination.limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(this.toDomain),
      total,
      took: Date.now() - start,
    };
  }
}
```

### Ingestion Module (Import Adapter)

Strategy-based import with mock implementation for demo.

```
ingestion/
├── strategies/
│   ├── import.strategy.ts       # Interface
│   └── mock-youtube.strategy.ts # Mock implementation
├── controllers/
│   └── import.controller.ts
├── services/
│   └── import.service.ts
└── ingestion.module.ts
```

**Strategy Pattern:**

```typescript
// ingestion/strategies/import.strategy.ts
export interface ImportStrategy {
  readonly source: Source;
  import(input: ImportInput): Promise<ImportResult>;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

// ingestion/strategies/mock-youtube.strategy.ts
@Injectable()
export class MockYouTubeStrategy implements ImportStrategy {
  readonly source = Source.YOUTUBE;

  constructor(private readonly contentService: ContentService) {}

  async import(input: YouTubeImportInput): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
    const fakeVideos = this.generateFakeVideos(input.count ?? 5);

    for (const video of fakeVideos) {
      // Idempotent: skip if externalId already exists
      const exists = await this.contentService.findByExternalId(video.id);
      if (exists) {
        result.skipped++;
        continue;
      }

      await this.contentService.create({
        externalId: video.id,
        source: Source.YOUTUBE,
        programId: input.programId,
        title: video.title,
        description: video.description,
        type: ContentType.PODCAST_EPISODE,
        category: input.category ?? Category.TECHNOLOGY,
        language: "ar",
        metadata: { duration: video.duration },
      });
      result.imported++;
    }

    return result;
  }

  private generateFakeVideos(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `yt-${Date.now()}-${i}`,
      title: `فنجان - الحلقة ${100 + i}`,
      description: "حلقة جديدة من بودكاست فنجان",
      duration: 3600 + Math.floor(Math.random() * 1800),
    }));
  }
}
```

---

## API Design

### CMS REST API

#### Programs

| Method   | Endpoint                        | Description               |
| -------- | ------------------------------- | ------------------------- |
| `POST`   | `/api/cms/programs`             | Create program            |
| `GET`    | `/api/cms/programs`             | List programs (paginated) |
| `GET`    | `/api/cms/programs/:id`         | Get program               |
| `PUT`    | `/api/cms/programs/:id`         | Update program            |
| `DELETE` | `/api/cms/programs/:id`         | Delete program            |
| `GET`    | `/api/cms/programs/:id/content` | List content in program   |

#### Content

| Method   | Endpoint               | Description                       |
| -------- | ---------------------- | --------------------------------- |
| `POST`   | `/api/cms/content`     | Create content                    |
| `GET`    | `/api/cms/content`     | List content (paginated)          |
| `GET`    | `/api/cms/content/:id` | Get content                       |
| `PUT`    | `/api/cms/content/:id` | Update content (including status) |
| `DELETE` | `/api/cms/content/:id` | Delete content                    |

#### Import

| Method | Endpoint                  | Description                 |
| ------ | ------------------------- | --------------------------- |
| `POST` | `/api/cms/import/youtube` | Trigger mock YouTube import |

**Import Request/Response:**

```http
POST /api/cms/import/youtube
Content-Type: application/json

{
  "playlistId": "demo",
  "programId": "550e8400-e29b-41d4-a716-446655440000",
  "count": 5,
  "category": "culture"
}
```

```http
HTTP/1.1 200 OK

{
  "imported": 5,
  "skipped": 0,
  "errors": []
}
```

#### Example Request/Response

```http
POST /api/cms/content
Content-Type: application/json

{
  "programId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fnjan Episode 50",
  "description": "A conversation about technology and culture",
  "type": "podcast_episode",
  "category": "culture",
  "language": "ar",
  "metadata": {
    "duration": 3600,
    "episodeNumber": 50,
    "guests": ["Guest Name"]
  }
}
```

```http
HTTP/1.1 201 Created

{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "programId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fnjan Episode 50",
  "status": "draft",
  "createdAt": "2026-01-31T10:00:00Z"
}
```

### Discovery GraphQL API

#### Schema

```graphql
type Query {
  # Programs
  programs(filter: ProgramFilter, pagination: Pagination): ProgramConnection!
  program(id: ID!): Program

  # Content
  contents(filter: ContentFilter, pagination: Pagination): ContentConnection!
  content(id: ID!): Content

  # Search
  search(query: String!, filter: SearchFilter, pagination: Pagination): SearchResult!
}

type Program {
  id: ID!
  title: String!
  description: String!
  type: ProgramType!
  category: Category!
  language: String!
  metadata: JSON
  contentCount: Int!
  contents(pagination: Pagination): ContentConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Content {
  id: ID!
  program: Program
  title: String!
  description: String!
  type: ContentType!
  category: Category!
  language: String!
  metadata: JSON
  publishedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type SearchResult {
  items: [SearchItem!]!
  total: Int!
  took: Int!
}

union SearchItem = Program | Content

input ProgramFilter {
  type: ProgramType
  category: Category
  language: String
}

input ContentFilter {
  programId: ID
  type: ContentType
  category: Category
  language: String
}

input SearchFilter {
  types: [ContentType!]
  categories: [Category!]
  language: String
  publishedAfter: DateTime
  publishedBefore: DateTime
}

input Pagination {
  limit: Int = 20
  offset: Int = 0
}
```

#### Example Query

```graphql
query SearchContent {
  search(query: "فنجان", filter: { categories: [CULTURE] }) {
    items {
      ... on Content {
        id
        title
        type
        program {
          title
        }
        metadata
        publishedAt
      }
    }
    total
    took
  }
}
```

---

## Event-Driven Communication

### Typed Domain Events

Events are pure TypeScript classes — no Protobuf, no serialization overhead.

```typescript
// domain/events/domain-event.ts
export abstract class DomainEvent {
  readonly occurredAt = new Date();
  abstract readonly eventName: string;
}

// domain/events/content.events.ts
export class ContentCreated extends DomainEvent {
  readonly eventName = "content.created";

  constructor(
    readonly contentId: string,
    readonly programId: string | null,
  ) {
    super();
  }
}

export class ContentPublished extends DomainEvent {
  readonly eventName = "content.published";

  constructor(
    readonly contentId: string,
    readonly programId: string | null,
    readonly title: string,
  ) {
    super();
  }
}

export class ContentUpdated extends DomainEvent {
  readonly eventName = "content.updated";

  constructor(
    readonly contentId: string,
    readonly programId: string | null,
    readonly updatedFields: string[],
  ) {
    super();
  }
}

export class ContentArchived extends DomainEvent {
  readonly eventName = "content.archived";

  constructor(
    readonly contentId: string,
    readonly programId: string | null,
  ) {
    super();
  }
}

export class ContentDeleted extends DomainEvent {
  readonly eventName = "content.deleted";

  constructor(
    readonly contentId: string,
    readonly programId: string | null,
  ) {
    super();
  }
}
```

### Event Flow

```mermaid
flowchart LR
    subgraph Domain["💎 Domain Services"]
        Create["➕ Create"]
        Update["✏️ Update"]
        Publish["🚀 Publish"]
        Archive["📁 Archive"]
        Delete["🗑️ Delete"]
    end

    subgraph EventBus["📡 In-Process EventEmitter"]
        E1["ContentCreated"]
        E2["ContentUpdated"]
        E3["ContentPublished"]
        E4["ContentArchived"]
        E5["ContentDeleted"]
    end

    subgraph Handlers["🎯 Event Handlers"]
        Cache["🧹 Cache<br>Invalidation"]
    end

    Create --> E1
    Update --> E2
    Publish --> E3
    Archive --> E4
    Delete --> E5

    E2 --> Cache
    E3 --> Cache
    E4 --> Cache
    E5 --> Cache

    style Create fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style Update fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Publish fill:#69db7c,stroke:#2f9e44,color:#14532d
    style Archive fill:#ffd166,stroke:#d4a012,color:#6b5900
    style Delete fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style E1 fill:#e9ecef,stroke:#868e96,color:#495057
    style E2 fill:#e9ecef,stroke:#868e96,color:#495057
    style E3 fill:#d3f9d8,stroke:#40c057,color:#2b8a3e
    style E4 fill:#fff3bf,stroke:#fab005,color:#e67700
    style E5 fill:#ffe3e3,stroke:#fa5252,color:#c92a2a
    style Cache fill:#fcc2d7,stroke:#e64980,color:#a61e4d
```

### Event Publisher Port Implementation

```typescript
// infrastructure/events/event-emitter.adapter.ts
@Injectable()
export class EventEmitterAdapter implements EventPublisherPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
```

### Cache Invalidation Handler

```typescript
// discovery/handlers/cache-invalidation.handler.ts
@Injectable()
export class CacheInvalidationHandler {
  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  @OnEvent("content.published")
  @OnEvent("content.updated")
  @OnEvent("content.archived")
  @OnEvent("content.deleted")
  async handleContentChange(
    event: ContentPublished | ContentUpdated | ContentArchived | ContentDeleted,
  ) {
    await this.cache.invalidate(`content:${event.contentId}`);

    if (event.programId) {
      await this.cache.invalidate(`program:${event.programId}:contents`);
    }

    // Invalidate search cache (all keys with search: prefix)
    // In production, use Redis SCAN or pattern-based invalidation
  }
}
```

### Content Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Create
    Draft --> Published: Publish
    Published --> Published: Update (invalidate cache)
    Published --> Archived: Archive (invalidate cache)
    Draft --> Deleted: Delete
    Published --> Deleted: Delete (invalidate cache)
    Archived --> Deleted: Delete

    note right of Draft: Not searchable
    note right of Published: Searchable + Cached
    note right of Archived: Not searchable
```

---

## Scalability Strategy

### Traffic Profile

| Module    | Traffic        | Strategy                        |
| --------- | -------------- | ------------------------------- |
| CMS       | ~100 req/hour  | Single instance sufficient      |
| Discovery | ~2,800 req/sec | Redis caching + PG optimization |

### Caching Layer (Redis)

```mermaid
flowchart LR
    Request["🌐 GraphQL Request"] --> Check{"💾 Cache Hit?"}
    Check -->|"✅ Yes"| Return["⚡ Return Cached<br>(< 5ms)"]
    Check -->|"❌ No"| PG["🐘 Query PostgreSQL<br>(10-50ms)"]
    PG --> Store["💾 Store in Redis"]
    Store --> Return2["📤 Return Response"]

    style Request fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Check fill:#ffd166,stroke:#d4a012,color:#6b5900
    style Return fill:#69db7c,stroke:#2f9e44,color:#14532d
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
    style Store fill:#ff6b6b,stroke:#c92a2a,color:#7f1d1d
    style Return2 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
```

**Cache Keys & TTL:**

| Data                 | TTL   | Key Pattern                    |
| -------------------- | ----- | ------------------------------ |
| Single content       | 5 min | `content:{id}`                 |
| Single program       | 5 min | `program:{id}`                 |
| Program with content | 5 min | `program:{id}:contents`        |
| Search results       | 1 min | `search:{hash(query+filters)}` |

**Cache Service:**

```typescript
// discovery/services/cache.service.ts
@Injectable()
export class CacheService implements CachePort {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

**Cache Invalidation Strategy:**

- **Event-driven**: Invalidate on content changes via domain events
- **TTL fallback**: Short TTL ensures eventual consistency
- **Simple keys**: No complex patterns, easy to reason about

### PostgreSQL Optimization

**Full-Text Search Index:**

```sql
-- GIN index for fast full-text search
CREATE INDEX idx_content_search ON content USING GIN(search_vector);

-- Partial index for published content only
CREATE INDEX idx_content_published ON content (id)
  WHERE status = 'published';

-- Composite index for filtered queries
CREATE INDEX idx_content_filter ON content (category, type, language, status);
```

**Query Optimization:**

- Use `search_vector @@ plainto_tsquery()` for full-text
- Use `ts_rank()` for relevance scoring
- Filter by status first (uses partial index)
- Limit results with pagination

### Horizontal Scaling Path

The application is **stateless** and ready for horizontal scaling:

```mermaid
flowchart TB
    LB["⚖️ Load Balancer<br>(future)"]

    subgraph Instances["🖥️ NestJS Instances"]
        App1["📦 Instance 1"]
        App2["📦 Instance 2"]
        App3["📦 Instance 3"]
    end

    subgraph Shared["⚙️ Shared Infrastructure"]
        Redis[("🔴 Redis")]
        PG[("🐘 PostgreSQL")]
    end

    LB --> App1
    LB --> App2
    LB --> App3

    App1 --> Redis
    App2 --> Redis
    App3 --> Redis

    App1 --> PG

    style LB fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style App1 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style App2 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style App3 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style Redis fill:#ff6b6b,stroke:#c92a2a,color:#7f1d1d
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
```

**Current Deployment:** Single instance (sufficient for assignment)  
**Scale Path:** When traffic exceeds ~500 req/sec, add instances behind load balancer

---

## Project Structure

```
src/
├── shared/                             # 📦 Shared Types (no business logic)
│   ├── entities/
│   │   ├── program.entity.ts           # Pure domain entity
│   │   ├── content.entity.ts           # Pure domain entity
│   │   ├── metadata/                   # Metadata interfaces
│   │   │   ├── content-metadata.interface.ts
│   │   │   └── program-metadata.interface.ts
│   │   └── index.ts
│   ├── enums/
│   │   ├── content-type.enum.ts
│   │   ├── category.enum.ts
│   │   ├── status.enum.ts
│   │   └── index.ts
│   ├── events/
│   │   ├── domain-event.ts             # Base event class
│   │   ├── content/                    # Content events (one file per event)
│   │   │   ├── content-created.event.ts
│   │   │   ├── content-published.event.ts
│   │   │   └── index.ts
│   │   ├── program/                    # Program events
│   │   │   ├── program-created.event.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── persistence/
│       └── entities/                   # TypeORM ORM entities (DB mapping)
│           ├── program.orm-entity.ts
│           └── content.orm-entity.ts
│
├── cms/                                # ✏️ CMS Module (Self-Contained)
│   ├── repositories/                   # Interfaces + Implementations
│   │   ├── content.repository.interface.ts  # ICmsContentRepository
│   │   ├── content.repository.ts            # TypeORM implementation
│   │   ├── program.repository.interface.ts  # ICmsProgramRepository
│   │   ├── program.repository.ts            # TypeORM implementation
│   │   ├── event-publisher.interface.ts     # ICmsEventPublisher
│   │   └── event-publisher.ts               # EventEmitter implementation
│   ├── controllers/
│   │   ├── program.controller.ts
│   │   ├── content.controller.ts
│   │   └── import.controller.ts
│   ├── dto/
│   │   ├── create-program.dto.ts
│   │   ├── create-content.dto.ts
│   │   └── ...
│   ├── services/
│   │   ├── content.service.ts          # CMS business logic
│   │   └── program.service.ts
│   └── cms.module.ts
│
├── discovery/                          # 🔍 Discovery Module (Self-Contained)
│   ├── repositories/                   # Interfaces + Implementations
│   │   ├── content-reader.interface.ts  # IDiscoveryContentReader (read-only)
│   │   ├── content-reader.ts            # TypeORM implementation
│   │   ├── program-reader.interface.ts  # IDiscoveryProgramReader (read-only)
│   │   ├── program-reader.ts            # TypeORM implementation
│   │   ├── cache.interface.ts           # IDiscoveryCache
│   │   └── cache.ts                     # Redis implementation
│   ├── resolvers/
│   │   ├── program.resolver.ts
│   │   ├── content.resolver.ts
│   │   └── search.resolver.ts
│   ├── services/
│   │   ├── search.service.ts           # PostgreSQL full-text search
│   │   └── cache.service.ts            # Cache orchestration + invalidation
│   ├── dto/
│   └── discovery.module.ts
│
├── ingestion/                          # 📥 Ingestion Module (Self-Contained)
│   ├── repositories/                   # Interfaces + Implementations
│   │   ├── content-writer.interface.ts  # IIngestionContentWriter
│   │   ├── content-writer.ts            # TypeORM implementation
│   │   ├── program-repository.interface.ts
│   │   ├── program-repository.ts
│   │   ├── event-publisher.interface.ts # IIngestionEventPublisher
│   │   └── event-publisher.ts           # EventEmitter implementation
│   ├── strategies/
│   │   ├── import.strategy.ts          # Strategy interface
│   │   └── mock-youtube.strategy.ts
│   ├── services/
│   │   └── ingestion.service.ts
│   └── ingestion.module.ts
│
├── infrastructure/                     # ⚙️ Shared Infrastructure
│   ├── persistence/
│   │   ├── typeorm.module.ts           # TypeORM configuration
│   │   └── migrations/
│   │       └── 1704067200000-CreateProgramsAndContent.ts
│   └── infrastructure.module.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── redis.config.ts
│
├── app.module.ts
└── main.ts
```

### Key Design Decisions

| Decision                                            | Rationale                                               |
| --------------------------------------------------- | ------------------------------------------------------- |
| `shared/entities/` are **pure classes**             | No TypeORM decorators — domain stays framework-free     |
| `shared/persistence/entities/` are **ORM entities** | Separate DB mapping from domain logic                   |
| Each module owns its **repositories/**              | Single folder with `*.interface.ts` + `*.ts` pairs      |
| Interfaces colocated with implementations           | Easy to find, navigate, and understand relationships    |
| `shared/` has **no business logic**                 | Only types, entities, enums, events                     |

### Module Independence

Each module is **self-contained** and can be extracted to a microservice:

| Module        | Owns                                | Depends On              |
| ------------- | ----------------------------------- | ----------------------- |
| **CMS**       | Repositories, Controllers, Services | shared/, TypeORM        |
| **Discovery** | Repositories, Resolvers, Services   | shared/, TypeORM, Redis |
| **Ingestion** | Repositories, Strategies, Services  | shared/, TypeORM        |

**Benefits:**

- ✅ Modules don't depend on each other
- ✅ Each module can be tested in isolation
- ✅ Easy to extract to microservice (take module folder)
- ✅ Interface Segregation: CMS doesn't see cache methods, Discovery doesn't see write methods

---

## Trade-offs & Alternatives

### Simplifications Made (Interview Scope)

| Original Design     | Simplified To               | Why                                         |
| ------------------- | --------------------------- | ------------------------------------------- |
| NATS JetStream      | In-process EventEmitter     | No external messaging infra needed for demo |
| Elasticsearch       | PostgreSQL Full-Text Search | One less service, sufficient for scope      |
| NATS KV             | Redis                       | Standard, well-known cache solution         |
| Protobuf schemas    | TypeScript classes          | No code generation, simpler DX              |
| Job tracking system | Sync idempotent import      | Simpler flow, no job state management       |

### Architecture Decisions

| Decision                          | Alternative Considered    | Why We Chose This                                                 |
| --------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| **Single `repositories/` folder** | Separate `ports/` + `adapters/` | Simpler structure — interfaces and implementations colocated      |
| **`*.interface.ts` + `*.ts` naming** | `.port.ts` + `.adapter.ts` | Cleaner naming, still clear distinction                          |
| **Modular Monolith**              | Microservices             | Simpler for assignment scope, clear boundaries, can extract later |
| **Some code duplication**         | Shared repository adapter | Independence > DRY — each module can evolve separately            |
| **shared/ has no business logic** | Domain services in shared | Keeps modules self-contained, shared is just types                |

### Module-Owned Ports Trade-offs

**Pros:**

- ✅ True Interface Segregation (each module sees only what it needs)
- ✅ Modules can be extracted to microservices independently
- ✅ Easy to test each module in isolation
- ✅ No hidden coupling through shared interfaces
- ✅ Changes to CMS don't affect Discovery or Ingestion

**Cons:**

- ⚠️ Some code duplication in adapters (e.g., `findById` logic)
- ⚠️ More files to maintain
- ⚠️ Need to update multiple adapters if ORM entity changes

**Why it's worth it:** The duplication is minimal (mostly boilerplate) and the independence gained is significant for a system that may scale to microservices.

### Decisions Retained

| Decision             | Alternative Considered   | Why We Kept This                                            |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| **PostgreSQL**       | MongoDB                  | Assignment mentions PostgreSQL, relational model fits       |
| **REST for CMS**     | GraphQL for both         | REST is simpler for CRUD, GraphQL shines for flexible reads |
| **JSONB metadata**   | Separate tables per type | Extensible without migrations, validates at app layer       |
| **Strategy Pattern** | Hard-coded importers     | Shows extensibility, easy to add RSS/Spotify later          |

### Production Evolution Path

If this were to go to production, we would consider:

| Current        | Production Upgrade     | Trigger                                        |
| -------------- | ---------------------- | ---------------------------------------------- |
| EventEmitter   | NATS JetStream / Kafka | Need event persistence, replay, multi-instance |
| PostgreSQL FTS | Elasticsearch          | Need typo tolerance, faceted search, >1M docs  |
| Single Redis   | Redis Cluster          | Cache size > single node memory                |
| Mock YouTube   | Real YouTube API       | Actual content import needed                   |

### Known Limitations

- No user management/authentication (out of scope)
- Single region deployment
- Mock importer (no real YouTube API integration)
- Cache invalidation is eventually consistent
- No rate limiting on public API

---

## Deployment

### Infrastructure (Development)

| Component  | Purpose                            |
| ---------- | ---------------------------------- |
| PostgreSQL | Source of truth + full-text search |
| Redis      | Caching layer                      |
| Node.js    | NestJS application                 |

### Docker Compose (Development)

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/thmanyah
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: thmanyah
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Running the Application

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Run migrations
npm run migration:run

# Start application
npm run start:dev

# Access
# - CMS REST API: http://localhost:3000/api/cms
# - Discovery GraphQL: http://localhost:3000/graphql
```

---

## Summary

This design delivers a **clean, demonstrable content management and discovery system** with:

- ✅ **Clean Architecture** — Pure domain layer with ports/adapters pattern
- ✅ **SOLID Principles** — Each component has single responsibility, open for extension
- ✅ **Simple Infrastructure** — Just PostgreSQL + Redis (easy to run locally)
- ✅ **Full-Stack Competency** — REST API + GraphQL + Caching + Search
- ✅ **Extensible Design** — Strategy pattern for importers, event-driven cache invalidation
- ✅ **Production-Ready Patterns** — Even though simplified, patterns scale

### What This Design Demonstrates

1. **Architectural Thinking** — Clean separation of concerns, dependency inversion
2. **Pragmatic Engineering** — Knowing when NOT to over-engineer
3. **Domain-Driven Design** — Rich domain entities, typed events
4. **Full-Stack Skills** — REST, GraphQL, PostgreSQL, Redis, TypeScript
5. **Testability** — Pure domain, injectable ports, mockable strategies

The system is designed to start simple and evolve — the modular monolith can be split into microservices, and infrastructure can be upgraded as traffic and requirements grow.
