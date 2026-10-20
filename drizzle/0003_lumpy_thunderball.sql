CREATE TABLE `astro_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `astro_accounts_email_unique` ON `astro_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `astro_login_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `astro_login_tokens_token_hash_unique` ON `astro_login_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `astro_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`report_tier` text NOT NULL,
	`analysis_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `astro_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`secret_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `astro_sessions_secret_hash_unique` ON `astro_sessions` (`secret_hash`);