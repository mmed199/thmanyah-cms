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
9. [Protobuf Schemas](#protobuf-schemas)
10. [Project Structure](#project-structure)
11. [Trade-offs & Alternatives](#trade-offs--alternatives)

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

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients["👥 Clients"]
        Editors["✏️ Editors<br>(Internal)"]
        Users["🌍 Public Users<br>(10M/hour)"]
    end

    subgraph Application["🏗️ NestJS Modular Monolith"]
        CMS["📝 CMS Module<br>(REST API)"]
        Discovery["🔍 Discovery Module<br>(GraphQL API)"]
        Content["📦 Content Module<br>(Core Domain)"]
        Ingestion["📥 Ingestion Module<br>(YouTube Importer)"]
    end

    subgraph Infrastructure["⚙️ Infrastructure"]
        PG[("🐘 PostgreSQL<br>Source of Truth")]
        ES[("🔎 Elasticsearch<br>Search Index")]
        NATS[("💬 NATS JetStream<br>Events + KV Cache")]
    end

    Editors --> CMS
    Users --> Discovery
    
    CMS --> Content
    Discovery --> Content
    Ingestion --> Content
    
    Content --> PG
    Content --> NATS
    Discovery --> ES
    Discovery --> NATS

    style Editors fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style Users fill:#ffd166,stroke:#d4a012,color:#6b5900
    style CMS fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Discovery fill:#b197fc,stroke:#7048e8,color:#3b1d8f
    style Content fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style Ingestion fill:#ffa94d,stroke:#e67700,color:#7c2d12
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
    style ES fill:#fcc419,stroke:#fab005,color:#713f12
    style NATS fill:#da77f2,stroke:#ae3ec9,color:#581c87
```

---

## Architecture

### Pattern: Modular Monolith

We chose a **modular monolith** over microservices to:

- Avoid premature distributed systems complexity
- Maintain clear module boundaries within a single deployable unit
- Enable future extraction to microservices if needed

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture Style | Modular Monolith | Simpler ops, clear boundaries, evolution-ready |
| Communication | In-process events + NATS persistence | Low latency, durable event log |
| CQRS-lite | CMS (writes) / Discovery (reads) | Optimize each path independently |
| Search | Elasticsearch | Industry-standard, handles complex queries at scale |

### Module Boundaries

```mermaid
flowchart LR
    subgraph Write["✍️ Write Path (Low Traffic)"]
        CMS["📝 CMS<br>REST API"]
        Ingestion["📥 Ingestion<br>YouTube Import"]
    end
    
    subgraph Core["💎 Core Domain"]
        Content["📦 Content Module<br>Entities + Events"]
    end
    
    subgraph Read["📖 Read Path (High Traffic)"]
        Discovery["🔍 Discovery<br>GraphQL API"]
    end
    
    subgraph Infra["⚙️ Infrastructure"]
        PG[("🐘 PostgreSQL")]
        ES[("🔎 Elasticsearch")]
        NATS[("💬 NATS")]
    end
    
    CMS --> Content
    Ingestion --> Content
    Content --> PG
    Content -->|"📤 Events"| NATS
    NATS -->|"📥 Consume"| Discovery
    Discovery --> ES
    Discovery -->|"💾 Cache"| NATS

    style CMS fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Ingestion fill:#ffa94d,stroke:#e67700,color:#7c2d12
    style Content fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style Discovery fill:#b197fc,stroke:#7048e8,color:#3b1d8f
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
    style ES fill:#fcc419,stroke:#fab005,color:#713f12
    style NATS fill:#da77f2,stroke:#ae3ec9,color:#581c87
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js + TypeScript | Type safety, ecosystem |
| **Framework** | NestJS | Modular architecture, DI, decorators |
| **Database** | PostgreSQL | Source of truth, relational model |
| **Search** | Elasticsearch | Full-text search, high read throughput |
| **Messaging** | NATS JetStream | Event streaming with persistence |
| **Caching** | NATS KV Store | Low-latency caching |
| **Serialization** | Protocol Buffers | Efficient event/cache encoding |
| **CMS API** | REST | Standard CRUD operations |
| **Discovery API** | GraphQL | Flexible queries for frontend |

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
        string external_id "🆔 nullable"
        jsonb metadata "⚙️"
        timestamp published_at "🚀 nullable"
        timestamp created_at "📅"
        timestamp updated_at "🔄"
    }
```

### Enums

```typescript
enum ProgramType {
  PODCAST_SERIES = 'podcast_series',
  DOCUMENTARY_SERIES = 'documentary_series',
}

enum ContentType {
  PODCAST_EPISODE = 'podcast_episode',
  DOCUMENTARY_EPISODE = 'documentary_episode',
  STANDALONE_VIDEO = 'standalone_video',
}

enum Category {
  TECHNOLOGY = 'technology',
  CULTURE = 'culture',
  BUSINESS = 'business',
  SOCIETY = 'society',
  ENTERTAINMENT = 'entertainment',
}

enum Status {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

enum Source {
  MANUAL = 'manual',
  YOUTUBE = 'youtube',
  RSS = 'rss',
}
```

### Metadata Schema (JSONB)

Type-specific fields are stored in the `metadata` column for extensibility:

```typescript
// Podcast/Documentary episode metadata
interface VideoMetadata {
  duration: number;        // seconds
  episodeNumber?: number;
  seasonNumber?: number;
  guests?: string[];
}

// Future: Newsletter metadata
interface NewsletterMetadata {
  readingTime: number;     // minutes
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

### Content Module (Core Domain)

The heart of the system — owns entities, business rules, and emits domain events.

**Responsibilities:**
- Define `Program` and `Content` entities
- Enforce domain rules (status transitions, validation)
- Emit domain events on state changes

**Key Interfaces:**
```typescript
interface ProgramRepository {
  create(program: Program): Promise<Program>;
  findById(id: string): Promise<Program | null>;
  update(id: string, data: Partial<Program>): Promise<Program>;
  delete(id: string): Promise<void>;
  findAll(filter: ProgramFilter, pagination: Pagination): Promise<PaginatedResult<Program>>;
}

interface ContentRepository {
  create(content: Content): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  update(id: string, data: Partial<Content>): Promise<Content>;
  delete(id: string): Promise<void>;
  findByProgramId(programId: string, pagination: Pagination): Promise<PaginatedResult<Content>>;
  findAll(filter: ContentFilter, pagination: Pagination): Promise<PaginatedResult<Content>>;
}
```

### CMS Module (Write API)

Internal REST API for content managers.

**Responsibilities:**
- CRUD operations for Programs and Content
- Input validation and authorization
- Trigger domain events via Content module

### Discovery Module (Read API)

Public GraphQL API optimized for high read traffic.

**Responsibilities:**
- Search and filter content via Elasticsearch
- Cache frequently accessed data in NATS KV
- Consume domain events to sync Elasticsearch index

### Ingestion Module

Isolates external data sources from core domain.

**Responsibilities:**
- Implement Strategy pattern for multiple sources
- Normalize external data to domain Content
- Trigger content creation via Content module

---

## API Design

### CMS REST API

#### Programs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cms/programs` | Create program |
| `GET` | `/api/cms/programs` | List programs (paginated) |
| `GET` | `/api/cms/programs/:id` | Get program |
| `PUT` | `/api/cms/programs/:id` | Update program |
| `DELETE` | `/api/cms/programs/:id` | Delete program |
| `GET` | `/api/cms/programs/:id/content` | List content in program |

#### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cms/content` | Create content |
| `GET` | `/api/cms/content` | List content (paginated) |
| `GET` | `/api/cms/content/:id` | Get content |
| `PUT` | `/api/cms/content/:id` | Update content (including status) |
| `DELETE` | `/api/cms/content/:id` | Delete content |

#### Import

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cms/import/youtube` | Trigger YouTube import |
| `GET` | `/api/cms/import/jobs` | List import jobs |
| `GET` | `/api/cms/import/jobs/:id` | Get import job status |

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

### Domain Events

```mermaid
flowchart LR
    subgraph CMS["📝 CMS Module"]
        Create["➕ Create/Update"]
        Publish["🚀 Publish"]
        Archive["📁 Archive"]
        Delete["🗑️ Delete"]
    end
    
    subgraph Events["💬 NATS JetStream"]
        E1["📄 ContentCreated"]
        E2["✏️ ContentUpdated"]
        E3["🎉 ContentPublished"]
        E4["📦 ContentArchived"]
        E5["❌ ContentDeleted"]
        E6["🔄 ProgramUpdated"]
        E7["🗑️ ProgramDeleted"]
    end
    
    subgraph Discovery["🔍 Discovery Module"]
        Sync["🔄 ES Sync"]
        Cache["🧹 Cache Invalidation"]
    end
    
    Create --> E1
    Create --> E2
    Publish --> E3
    Archive --> E4
    Delete --> E5
    
    E3 --> Sync
    E2 --> Sync
    E4 --> Sync
    E5 --> Sync
    E6 --> Sync
    E7 --> Sync
    
    E2 --> Cache
    E4 --> Cache
    E5 --> Cache

    style Create fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style Publish fill:#69db7c,stroke:#2f9e44,color:#14532d
    style Archive fill:#ffd166,stroke:#d4a012,color:#6b5900
    style Delete fill:#ff8787,stroke:#c92a2a,color:#7f1d1d
    style E1 fill:#e9ecef,stroke:#868e96,color:#495057
    style E2 fill:#e9ecef,stroke:#868e96,color:#495057
    style E3 fill:#d3f9d8,stroke:#40c057,color:#2b8a3e
    style E4 fill:#fff3bf,stroke:#fab005,color:#e67700
    style E5 fill:#ffe3e3,stroke:#fa5252,color:#c92a2a
    style E6 fill:#e9ecef,stroke:#868e96,color:#495057
    style E7 fill:#ffe3e3,stroke:#fa5252,color:#c92a2a
    style Sync fill:#d0bfff,stroke:#7950f2,color:#5f3dc4
    style Cache fill:#fcc2d7,stroke:#e64980,color:#a61e4d
```

### Event Definitions

| Event | Trigger | Elasticsearch Action |
|-------|---------|---------------------|
| `ContentCreated` | Content created | None (draft) |
| `ContentUpdated` | Content modified | Reindex if published |
| `ContentPublished` | Status → published | Index |
| `ContentArchived` | Status → archived | Remove |
| `ContentDeleted` | Content deleted | Remove |
| `ProgramUpdated` | Program modified | Reindex published content |
| `ProgramDeleted` | Program deleted | Remove all content |

### Key Rule: Only Published Content in Elasticsearch

```mermaid
stateDiagram-v2
    [*] --> Draft: Create
    Draft --> Published: Publish
    Published --> Published: Update (reindex ES)
    Published --> Archived: Archive (remove from ES)
    Draft --> Deleted: Delete
    Published --> Deleted: Delete (remove from ES)
    Archived --> Deleted: Delete
    
    note right of Draft: Not in Elasticsearch
    note right of Published: Indexed in Elasticsearch
    note right of Archived: Not in Elasticsearch
```

---

## Scalability Strategy

### Traffic Profile

| Module | Traffic | Strategy |
|--------|---------|----------|
| CMS | ~100 req/hour | Single instance sufficient |
| Discovery | ~2,800 req/sec | Caching + ES optimization |

### Caching Layer (NATS KV)

```mermaid
flowchart LR
    Request["🌐 GraphQL Request"] --> Check{"💾 Cache Hit?"}
    Check -->|"✅ Yes"| Return["⚡ Return Cached<br>(< 5ms)"]
    Check -->|"❌ No"| ES["🔎 Query Elasticsearch<br>(20-100ms)"]
    ES --> Store["💾 Store in NATS KV"]
    Store --> Return2["📤 Return Response"]

    style Request fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style Check fill:#ffd166,stroke:#d4a012,color:#6b5900
    style Return fill:#69db7c,stroke:#2f9e44,color:#14532d
    style ES fill:#fcc419,stroke:#fab005,color:#713f12
    style Store fill:#da77f2,stroke:#ae3ec9,color:#581c87
    style Return2 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
```

**Cache Strategy:**

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Single content | 5 min | `content:{id}` |
| Program with content | 5 min | `program:{id}` |
| Search results | 1 min | `search:{hash(query+filters)}` |

**Cache Invalidation:**
- Event-driven invalidation on content changes
- Short TTL ensures eventual consistency

### Elasticsearch Optimization

**Index Settings:**
```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2,
    "refresh_interval": "5s"
  }
}
```

**Query Optimization:**
- Use `filter` context for exact matches (cacheable)
- Limit `_source` fields returned
- Use `search_after` for deep pagination

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
        NATS[("💬 NATS")]
        PG[("🐘 PostgreSQL")]
        ES[("🔎 Elasticsearch")]
    end
    
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> NATS
    App2 --> NATS
    App3 --> NATS
    
    App1 --> PG
    App1 --> ES

    style LB fill:#74c0fc,stroke:#1971c2,color:#0c4a6e
    style App1 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style App2 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style App3 fill:#a8e6cf,stroke:#2d6a4f,color:#1b4332
    style NATS fill:#da77f2,stroke:#ae3ec9,color:#581c87
    style PG fill:#69db7c,stroke:#2f9e44,color:#14532d
    style ES fill:#fcc419,stroke:#fab005,color:#713f12
```

**Current Deployment:** Single instance (sufficient for assignment)  
**Scale Trigger:** When traffic exceeds ~500 req/sec

---

## Protobuf Schemas

### Events

```protobuf
// proto/events/content.proto
syntax = "proto3";
package thmanyah.events;

import "google/protobuf/timestamp.proto";

message ContentPublished {
  string content_id = 1;
  string program_id = 2;
  string title = 3;
  string description = 4;
  string type = 5;
  string category = 6;
  string language = 7;
  ContentMetadata metadata = 8;
  google.protobuf.Timestamp published_at = 9;
}

message ContentUpdated {
  string content_id = 1;
  string program_id = 2;
  string status = 3;
  repeated string updated_fields = 4;
  google.protobuf.Timestamp updated_at = 5;
}

message ContentArchived {
  string content_id = 1;
  string program_id = 2;
  google.protobuf.Timestamp archived_at = 3;
}

message ContentDeleted {
  string content_id = 1;
  string program_id = 2;
  google.protobuf.Timestamp deleted_at = 3;
}

message ContentMetadata {
  int32 duration = 1;
}
```

```protobuf
// proto/events/program.proto
syntax = "proto3";
package thmanyah.events;

import "google/protobuf/timestamp.proto";

message ProgramUpdated {
  string program_id = 1;
  repeated string updated_fields = 2;
  google.protobuf.Timestamp updated_at = 3;
}

message ProgramDeleted {
  string program_id = 1;
  google.protobuf.Timestamp deleted_at = 2;
}
```

### Cache Values

```protobuf
// proto/cache/content.proto
syntax = "proto3";
package thmanyah.cache;

import "google/protobuf/timestamp.proto";

message CachedContent {
  string id = 1;
  string title = 2;
  string description = 3;
  string type = 4;
  string category = 5;
  string language = 6;
  CachedProgram program = 7;
  ContentMetadata metadata = 8;
  google.protobuf.Timestamp published_at = 9;
}

message CachedProgram {
  string id = 1;
  string title = 2;
  string type = 3;
}

message CachedSearchResult {
  repeated CachedContent items = 1;
  int32 total = 2;
  int32 took_ms = 3;
  google.protobuf.Timestamp cached_at = 4;
}
```

---

## Project Structure

```
src/
├── modules/
│   ├── content/                    # Core Domain Module
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── program.entity.ts
│   │   │   │   └── content.entity.ts
│   │   │   ├── enums/
│   │   │   └── events/
│   │   ├── application/
│   │   │   ├── services/
│   │   │   └── interfaces/
│   │   ├── infrastructure/
│   │   │   └── repositories/
│   │   └── content.module.ts
│   │
│   ├── cms/                        # CMS Module (REST)
│   │   ├── controllers/
│   │   ├── dto/
│   │   └── cms.module.ts
│   │
│   ├── discovery/                  # Discovery Module (GraphQL)
│   │   ├── resolvers/
│   │   ├── dto/
│   │   ├── services/
│   │   └── discovery.module.ts
│   │
│   └── ingestion/                  # Ingestion Module
│       ├── strategies/
│       ├── controllers/
│       └── ingestion.module.ts
│
├── infrastructure/
│   ├── database/
│   ├── elasticsearch/
│   ├── nats/
│   └── event-bus/
│
├── generated/                      # Protobuf generated code
├── common/
├── config/
├── app.module.ts
└── main.ts

proto/                              # Protobuf source files
├── events/
├── cache/
└── ingestion/
```

---

## Trade-offs & Alternatives

### Decisions Made

| Decision | Alternative Considered | Why We Chose This |
|----------|----------------------|-------------------|
| **Modular Monolith** | Microservices | Simpler for assignment scope, clear boundaries, can extract later |
| **NATS** | Redis + RabbitMQ | Unified solution for events + caching, JetStream persistence |
| **PostgreSQL + ES** | MongoDB + Atlas Search | Assignment mentions PostgreSQL, ES is industry standard |
| **REST for CMS** | GraphQL for both | REST is simpler for CRUD, GraphQL shines for flexible reads |
| **JSONB metadata** | Separate tables per type | Extensible without migrations, validates at app layer |

### Future Improvements

1. **Authentication/Authorization** — Add JWT auth for CMS, rate limiting for Discovery
2. **Real-time Sync** — WebSockets or SSE for live content updates
3. **Advanced Search** — Faceted search, autocomplete, typo tolerance
4. **Monitoring** — OpenTelemetry tracing, Prometheus metrics
5. **CI/CD** — GitHub Actions for testing, Docker for deployment

### Known Limitations

- No user management (out of scope)
- Single region deployment
- YouTube importer requires API quota management
- Cache invalidation is eventually consistent

---

## Deployment

### Infrastructure (DigitalOcean)

| Component | Specification |
|-----------|---------------|
| Droplet | 4GB RAM, 2 vCPU |
| PostgreSQL | Self-hosted or Managed |
| Elasticsearch | Self-hosted (2GB heap) |
| NATS | Self-hosted (minimal footprint) |

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - elasticsearch
      - nats
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/thmanyah
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - NATS_URL=nats://nats:4222

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: thmanyah
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  nats:
    image: nats:2.10
    command: ["--jetstream", "--store_dir=/data"]
    volumes:
      - nats_data:/data

volumes:
  postgres_data:
  es_data:
  nats_data:
```

---

## Summary

This design delivers a **scalable content management and discovery system** with:

- ✅ Clean modular architecture following SOLID principles
- ✅ Optimized read path for 10M users/hour
- ✅ Extensible data model for future content types
- ✅ Event-driven communication for loose coupling
- ✅ YouTube import capability with strategy pattern
- ✅ Production-ready infrastructure choices

The system is designed to start simple and evolve — the modular monolith can be split into microservices as traffic and team size grow.
