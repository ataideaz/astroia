CREATE TABLE `marketing_suppressions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_suppressions_email_unique` ON `marketing_suppressions` (`email`);--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`request_type` text NOT NULL,
	`details` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `marketing_leads` ADD `revoked_at` integer;