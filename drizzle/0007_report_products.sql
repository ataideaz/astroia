CREATE TABLE `report_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`items` text NOT NULL,
	`checkout_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `report_orders_token_hash_idx` ON `report_orders` (`token_hash`);
--> statement-breakpoint
ALTER TABLE `guest_reports` ADD `compat_json` text;
