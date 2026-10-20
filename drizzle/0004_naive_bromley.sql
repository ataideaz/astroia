CREATE TABLE `guest_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guest_reports` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`request_json` text NOT NULL,
	`analysis_json` text NOT NULL,
	`order_id` text,
	`created_at` integer NOT NULL
);
