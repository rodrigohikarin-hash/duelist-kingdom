CREATE TABLE `store_invites` (
	`hash` text PRIMARY KEY NOT NULL,
	`store` text NOT NULL,
	`role` text NOT NULL,
	`expires` text NOT NULL,
	`used` text
);
--> statement-breakpoint
CREATE TABLE `loyalty_ledger` (
	`store` text NOT NULL,
	`user` text NOT NULL,
	`id` text NOT NULL,
	`points` integer NOT NULL,
	`description` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`store`, `user`, `id`)
);
--> statement-breakpoint
CREATE TABLE `store_members` (
	`store` text NOT NULL,
	`user` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`store`, `user`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`store` text NOT NULL,
	`event` text NOT NULL,
	`user` text NOT NULL,
	`ranking_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL,
	`checked` text,
	`paid` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`store`, `event`, `user`)
);
--> statement-breakpoint
CREATE INDEX `registration_event_idx` ON `registrations` (`store`,`event`);--> statement-breakpoint
CREATE TABLE `store_records` (
	`store` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`store`, `kind`, `id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
