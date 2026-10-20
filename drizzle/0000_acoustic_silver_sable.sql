CREATE TABLE `marketing_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`marketing_consent` integer NOT NULL,
	`consent_version` text NOT NULL,
	`source` text NOT NULL,
	`selected_theme` text,
	`consented_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_leads_email_unique` ON `marketing_leads` (`email`);