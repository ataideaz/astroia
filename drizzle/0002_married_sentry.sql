CREATE TABLE `payment_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_mode` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`customer_email` text,
	`person_name` text,
	`theme_label` text,
	`status` text NOT NULL,
	`provider_preference_id` text,
	`provider_payment_id` text,
	`provider_status` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`approved_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_provider_preference_id_unique` ON `payment_orders` (`provider_preference_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_provider_payment_id_unique` ON `payment_orders` (`provider_payment_id`);