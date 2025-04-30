# Web Crawler

A simple web crawler that downloads images from the web, built with Bun and TypeScript. The application uses bun:sqlite with Drizzle ORM for logging and tracking crawl activities.

## Installation

```bash
# Install dependencies
bun install

# Set up the database
bun run db:migrate

# Build the project
bun run build
```

## Usage

```bash
bun run src/index.ts <start_url> [options]
```

Or after building:

```bash
./dist/index.js <start_url> [options]
```

### Arguments

- `start_url` - The URL of the page where crawling starts

### Options

- `-d, --depth <depth>` - The crawl depth (default: 1)
- `-e, --external-links` - Allow crawling external links (default: false)
- `--exclude <formats>` - Comma-separated list of file formats to exclude (e.g., "jpg,png")
- `--include <formats>` - Comma-separated list of file formats to include (e.g., "jpg,png")
- `-h, --help` - Display help information
- `-V, --version` - Output the version number

### Examples

```bash
# Crawl only the starting page
bun run src/index.ts https://example.com

# Crawl to a depth of 3
bun run src/index.ts https://example.com -d 3

# Allow crawling external links
bun run src/index.ts https://example.com --external-links

# Only download PNG and JPG images
bun run src/index.ts https://example.com --include png,jpg

# Exclude GIF images
bun run src/index.ts https://example.com --exclude gif
```

## Output

The results will be placed in a folder called `images` which also contains an `index.json` file that lists all the collected images in the following format:

```json
{
  "images": [
    {
      "url": "the image url",
      "page": "the url of the page the image was found",
      "depth": "the depth of the page"
    }
  ]
}
```

## Database

The application uses bun:sqlite with Drizzle ORM to log all crawl activities. Each crawl session is logged with the following information:

- Starting URL and crawl depth
- Crawl options (external links, included/excluded formats)
- Downloaded files
- Crawl status (pending, success, error)

### Database Commands

```bash
# Generate migration files
bun run db:generate

# Apply migrations to the database
bun run db:migrate

# Drop all tables (caution!)
bun run db:drop
```
