CREATE TABLE `asaas_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`payment_id` text NOT NULL,
	`customer_id` text,
	`payment_link` text,
	`external_reference` text,
	`amount_cents` integer NOT NULL,
	`payment_status` text NOT NULL,
	`processing_status` text NOT NULL,
	`received_at` integer NOT NULL
);
