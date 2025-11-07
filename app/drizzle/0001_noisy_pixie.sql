PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tractor` text NOT NULL,
	`horsepower` integer,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_results`("id", "name", "tractor", "horsepower", "timestamp") SELECT "id", "name", "tractor", "horsepower", "timestamp" FROM `results`;--> statement-breakpoint
DROP TABLE `results`;--> statement-breakpoint
ALTER TABLE `__new_results` RENAME TO `results`;--> statement-breakpoint
PRAGMA foreign_keys=ON;