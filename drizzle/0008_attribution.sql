CREATE TABLE `site_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`campaign` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_events_day_idx` ON `site_events` (`day`, `type`);
--> statement-breakpoint
ALTER TABLE `guest_reports` ADD `attribution_json` text;
--> statement-breakpoint
ALTER TABLE `report_orders` ADD `attribution_json` text;
--> statement-breakpoint
ALTER TABLE `report_orders` ADD `capi_sent_at` integer;
