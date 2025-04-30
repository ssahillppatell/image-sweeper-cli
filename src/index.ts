import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import * as cheerio from "cheerio";
import { Command } from "commander";
import { createLog, updateLog } from "./utils/db";
import { log } from "./utils/log";

interface CrawlImage {
	url: string;
	page: string;
	depth: number;
}

interface CrawlResults {
	images: CrawlImage[];
}

interface CrawlOptions {
	depth: number;
	allowExternalLinks: boolean;
	excludeFormats: string[];
	includeFormats: string[];
}

const visitedUrls = new Set<string>();
const results: CrawlResults = { images: [] };

async function fetchPage(url: string): Promise<string | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			log.error(`Failed to fetch ${url}: ${response.statusText}`);
			return null;
		}
		return await response.text();
	} catch (error) {
		log.error(`Error fetching ${url}: ${error}`);
		return null;
	}
}

function extractImagesFromHtml(
	html: string,
	pageUrl: string,
	depth: number,
	options: CrawlOptions,
): CrawlImage[] {
	const $ = cheerio.load(html);
	const baseUrl = new URL(pageUrl).origin;
	const images: CrawlImage[] = [];

	$("img").each((_, element) => {
		let imageUrl = $(element).attr("src");
		if (!imageUrl) return;

		if (imageUrl.startsWith("/")) {
			imageUrl = `${baseUrl}${imageUrl}`;
		} else if (!imageUrl.startsWith("http")) {
			const pageUrlObj = new URL(pageUrl);
			const pagePath = `${pageUrlObj.pathname.split("/").slice(0, -1).join("/")}/`;
			imageUrl = `${pageUrlObj.origin}${pagePath}${imageUrl}`;
		}

		const extension = path.extname(imageUrl).toLowerCase().substring(1);

		if (
			options.excludeFormats.length > 0 &&
			options.excludeFormats.includes(extension)
		) {
			return;
		}
		if (
			options.includeFormats.length > 0 &&
			!options.includeFormats.includes(extension)
		) {
			return;
		}

		images.push({
			url: imageUrl,
			page: pageUrl,
			depth: depth,
		});
	});

	return images;
}

function extractLinksFromHtml(
	html: string,
	pageUrl: string,
	options: CrawlOptions,
): string[] {
	const $ = cheerio.load(html);
	const baseUrl = new URL(pageUrl).origin;
	const pageHostname = new URL(pageUrl).hostname;
	const links: string[] = [];

	$("a").each((_, element) => {
		let href = $(element).attr("href");
		if (!href) return;

		if (href.startsWith("#") || href.startsWith("javascript:")) {
			return;
		}

		if (href.startsWith("/")) {
			href = `${baseUrl}${href}`;
		} else if (!href.startsWith("http")) {
			const pageUrlObj = new URL(pageUrl);
			const pagePath = `${pageUrlObj.pathname.split("/").slice(0, -1).join("/")}/`;
			href = `${pageUrlObj.origin}${pagePath}${href}`;
		}

		try {
			const urlObj = new URL(href);
			if (!options.allowExternalLinks && urlObj.hostname !== pageHostname) {
				return;
			}

			links.push(href);
		} catch (e) {
			log.error(`Invalid URL: ${href}`);
		}
	});

	return links;
}

async function downloadImage(imageUrl: string): Promise<boolean> {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			log.error(`Failed to download image ${imageUrl}: ${response.statusText}`);
			return false;
		}

		const imageData = await response.arrayBuffer();
		const fileName =
			path.basename(new URL(imageUrl).pathname) || `image_${Date.now()}`;

		if (!fs.existsSync("images")) {
			fs.mkdirSync("images", { recursive: true });
		}

		await Bun.write(`images/${fileName}`, imageData);
		log.info(`Downloaded: ${fileName}`);
		return true;
	} catch (error) {
		log.error(`Error downloading image ${imageUrl}: ${error}`);
		return false;
	}
}

async function crawl(
	url: string,
	currentDepth: number,
	options: CrawlOptions,
): Promise<void> {
	if (visitedUrls.has(url)) {
		return;
	}

	visitedUrls.add(url);
	log.info(`Crawling (${currentDepth}/${options.depth}): ${url}`);

	const html = await fetchPage(url);
	if (!html) return;

	const images = extractImagesFromHtml(html, url, currentDepth, options);
	for (const image of images) {
		results.images.push(image);
		await downloadImage(image.url);
	}

	if (currentDepth < options.depth) {
		const links = extractLinksFromHtml(html, url, options);
		for (const link of links) {
			await crawl(link, currentDepth + 1, options);
		}
	}
}

async function saveResults() {
	if (!fs.existsSync("images")) {
		fs.mkdirSync("images", { recursive: true });
	}

	await Bun.write("images/index.json", JSON.stringify(results, null, 2));
	log.info("Results saved to images/index.json");
}

async function main() {
	const program = new Command();

	program
		.name("crawl")
		.description("Web crawler that downloads images from websites")
		.argument("<startUrl>", "URL where crawling starts")
		.option("-d, --depth <depth>", "Crawl depth (default: 1)", "1")
		.option("-e, --external-links", "Allow crawling external links", false)
		.option(
			"--exclude <formats>",
			"Comma-separated list of file formats to exclude",
			"",
		)
		.option(
			"--include <formats>",
			"Comma-separated list of file formats to include",
			"",
		)
		.version("1.0.0")
		.action(async (startUrl: string, options) => {
			const depth = Number.parseInt(options.depth);
			if (Number.isNaN(depth) || depth < 1) {
				log.error("Depth must be a positive integer");
				process.exit(1);
			}

			const crawlOptions: CrawlOptions = {
				depth,
				allowExternalLinks: options.externalLinks,
				excludeFormats: options.exclude
					? options.exclude
							.split(",")
							.map((f: string) => f.trim().toLowerCase())
					: [],
				includeFormats: options.include
					? options.include
							.split(",")
							.map((f: string) => f.trim().toLowerCase())
					: [],
			};

			log.info(`Starting crawl from ${startUrl} with depth ${depth}`);
			if (crawlOptions.allowExternalLinks) {
				log.info("External links will be crawled");
			}
			if (crawlOptions.excludeFormats.length > 0) {
				log.info(
					`Excluding formats: ${crawlOptions.excludeFormats.join(", ")}`,
				);
			}
			if (crawlOptions.includeFormats.length > 0) {
				log.info(
					`Including only formats: ${crawlOptions.includeFormats.join(", ")}`,
				);
			}

			const logId = await createLog({
				url: startUrl,
				depth: crawlOptions.depth,
				options: JSON.stringify(crawlOptions),
			});

			try {
				await crawl(startUrl, 1, crawlOptions);
				await updateLog({
					id: logId,
					files: results.images.map((i) => i.url),
					status: "success",
				});
				await saveResults();
				log.info("Crawling completed successfully.");
			} catch (error) {
				await updateLog({
					id: logId,
					error: error instanceof Error ? error.message : String(error),
					status: "error",
				});
				log.error("Error during crawl:", error);
				process.exit(1);
			}
		});

	program.parse();
}

main();
