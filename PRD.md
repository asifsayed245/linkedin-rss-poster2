# Product Requirements Document (PRD): LinkedIn RSS Poster

## 1. Project Overview
The **LinkedIn RSS Poster** is an automated content generation system designed to fetch Tech and AI news from various RSS feeds, intelligently summarize them, and create engaging LinkedIn posts. It leverages AI models for text summarization and high-quality image generation, streamlining the content creation process for tech professionals.

## 2. Core Features
-   **RSS Aggregation**: Fetches and parses articles from multiple tech and AI-focused RSS feeds (e.g., TechCrunch, VentureBeat, Ars Technica).
-   **Content Scraping**: Automatically retrieves full article content when RSS feeds provide only summaries.
-   **Intelligent Summarization**: Uses Hugging Face inference API (e.g., BART model) to generate concise, engaging summaries.
-   **LinkedIn Post Generation**: Creates structured LinkedIn posts with:
    -   Compelling hooks/questions.
    -   Key insights and commentary.
    -   Relevant hashtags.
    -   Source citations.
-   **Visual Content Creation**:
    -   **AI Images**: Generates high-quality images using **Black Forest Labs FLUX.1-schnell** via Hugging Face API (with Pollinations.ai fallback).
    -   **Infographics**: automatically creates HTML-based infographics highlighting key takeaways.
-   **Scheduling**: Built-in scheduler (`node-cron`) to run content generation jobs at configurable times.
-   **Draft Management**: Saves generated content as drafts for review, exportable to JSON or Markdown.

## 3. System Architecture

### 3.1 Tech Stack
-   **Runtime**: Node.js (v20.x) with TypeScript
-   **Database**: SQLite (`better-sqlite3`) for storing articles and posts.
-   **APIs**:
    -   **Hugging Face Inference API**: For Text Summarization (`facebook/bart-large-cnn`) and Image Generation (`FLUX.1-schnell`).
    -   **Pollinations.ai**: Fallback image generation provider.
-   **Libraries**:
    -   `rss-parser`: RSS feed parsing.
    -   `cheerio`: HTML scraping and content cleaning.
    -   `axios`: HTTP requests.
    -   `node-cron`: Task scheduling.
    -   `dotenv`: Environment configuration.

### 3.2 Key Services
1.  **RssFetcher (`src/services/rssFetcher.ts`)**:
    -   Iterates through enabled sources in `src/config/sources.ts`.
    -   Fetches RSS feeds and scrapes full article text if necessary.
    -   Cleans HTML and unnecessary metadata.
    -   Filters articles based on minimum length/quality.

2.  **DatabaseService (`src/services/database.ts`)**:
    -   Manages SQLite database (`data/articles.db`).
    -   Tables:
        -   `articles`: Stores raw fetched content, deduplicates by link.
        -   `linkedin_posts`: Stores generated drafts, hashtags, image URLs, status.
    -   Handles CRUD operations and statistics tracking.

3.  **PostGenerator (`src/services/postGenerator.ts`)**:
    -   Orchestrates the content creation pipeline.
    -   Generates text summaries and post structure.
    -   Calls `ImageGenerator` for visuals.
    -   Calls `InfographicGenerator` for data visualization.

4.  **ImageGenerator (`src/services/imageGenerator.ts`)**:
    -   Primary: **Hugging Face (`FLUX.1-schnell`)**.
    -   Fallback: **Pollinations.ai (`flux-realism`)**.
    -   Generates smart prompts based on article title/summary/category.
    -   Maintains a "clean, sharp, professional" aesthetic (no haze/blur).

5.  **InfographicGenerator (`src/services/infographicGenerator.ts`)**:
    -   Extracts top 5 key sentences from the post.
    -   Generates a branded HTML infographic with category-specific color themes (AI: Blue/Purple, Tech: Teal/Green, Science: Orange).

6.  **Scheduler (`src/services/scheduler.ts`)**:
    -   Runs daily job (default: 9:00 AM).
    -   Flow: Fetch -> Store New -> Process Unprocessed -> Generate Post -> Save Draft.

7.  **ReviewInterface (`src/services/review.ts`)**:
    -   CLI tool for managing drafts.
    -   Commands: `npm run review`, `npm run review:export`, `npm run review:md`.

## 4. Configuration
Configuration handles via `.env` file and `src/config/config.ts`.

### Environment Variables
| Variable | Description |
| :--- | :--- |
| `HUGGINGFACE_TOKEN` | API Token for Hugging Face Inference (Required for High Quality) |
| `SUMMARIZATION_MODEL` | HF Model for text (Default: `facebook/bart-large-cnn`) |
| `SCHEDULE_HOUR` | Hour to run daily job (0-23) |
| `SCHEDULE_MINUTE` | Minute to run daily job (0-59) |
| `SCHEDULE_TIMEZONE` | Timezone (e.g., `America/New_York`) |
| `MAX_POSTS_PER_DAY` | Limit generated posts per run (Default: 3) |
| `DATABASE_PATH` | Path to SQLite DB (Default: `./data/articles.db`) |

## 5. Data Flow
1.  **Trigger**: Scheduler or Manual Run (`npm run fetch`).
2.  **Acquisition**: `RssFetcher` pulls feed -> Parsed -> Scraped -> Cleaned.
3.  **Storage**: `DatabaseService` saves new articles (ignores duplicates).
4.  **Processing**: `PostGenerator` picks unprocessed articles (up to daily limit).
5.  **Generation**:
    -   Text Summary (HF API).
    -   Draft Creation (Hook, Body, Tags).
    -   Image Generation (HF Flux / Pollinations).
    -   Infographic Creation (HTML).
6.  **Output**: Post saved to DB with status `draft`.
7.  **Review**: User reviews drafts via CLI or exports them.

## 6. Directory Structure
```
linkedin-rss-poster/
├── data/               # SQLite database
├── public/
│   ├── images/         # Generated AI images
│   └── infographics/   # Generated HTML infographics
├── src/
│   ├── config/         # Config and Source definitions
│   ├── services/       # Core business logic services
│   ├── index.ts        # CLI entry point
│   └── web.ts          # Web server entry point (if used)
├── .env                # Secrets
├── package.json        # Dependencies
└── PRD.md              # Project Documentation
```

## 7. Future Enhancements
-   **LinkedIn API Integration**: Auto-posting directly to LinkedIn (currently manual/draft only).
-   **Web Dashboard**: A full UI for reviewing drafts and managing settings.
-   **More Sources**: Adding support for custom RSS feeds via UI.
-   **Analytics**: Tracking post performance (likes/shares) if API is integrated.
