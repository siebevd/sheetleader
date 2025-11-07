CREATE TABLE `sync_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text NOT NULL,
	`message` text NOT NULL,
	`records_added` integer,
	`records_updated` integer,
	`records_deleted` integer,
	`error_details` text
);
--> statement-breakpoint
ALTER TABLE `results` ADD `sheet_row_id` text;