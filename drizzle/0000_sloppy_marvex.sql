CREATE TABLE `log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`depth` integer DEFAULT 1 NOT NULL,
	`options` text,
	`files` text,
	`status` text,
	`error` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
