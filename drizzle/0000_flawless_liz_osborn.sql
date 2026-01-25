CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_number` integer,
	`created_at` integer NOT NULL,
	`customer_name` text,
	`items` text NOT NULL,
	`total_amount` real NOT NULL,
	`business_snapshot` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receipts_receipt_number_unique` ON `receipts` (`receipt_number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_name` text,
	`business_address` text,
	`logo_uri` text,
	`signature_uri` text
);
