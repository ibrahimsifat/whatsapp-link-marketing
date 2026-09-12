ALTER TABLE `contacts` ADD `city` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `language` text;--> statement-breakpoint
CREATE INDEX `idx_contacts_city` ON `contacts` (`city`);--> statement-breakpoint
CREATE INDEX `idx_contacts_language` ON `contacts` (`language`);