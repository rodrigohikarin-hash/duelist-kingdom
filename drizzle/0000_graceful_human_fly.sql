CREATE TABLE `tournaments` (
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`event_date` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `tournaments_month_idx` ON `tournaments` (`owner_id`,`status`,`event_date`);