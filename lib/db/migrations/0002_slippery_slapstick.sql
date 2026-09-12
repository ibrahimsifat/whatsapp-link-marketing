ALTER TABLE `message_templates` ADD `group_id` text;--> statement-breakpoint
ALTER TABLE `message_templates` ADD `language` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `message_templates` ADD `is_fallback` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `message_templates` ADD `image_url` text;--> statement-breakpoint
-- Backfill: every pre-existing template becomes a single-variant group of
-- its own (English content, and its own fallback), so nothing loses its
-- identity and the unique (group_id, language) index below can be created.
UPDATE `message_templates` SET `group_id` = `id` WHERE `group_id` IS NULL;--> statement-breakpoint
UPDATE `message_templates` SET `is_fallback` = 1 WHERE `is_fallback` = 0;--> statement-breakpoint
CREATE INDEX `idx_templates_group` ON `message_templates` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_templates_group_language` ON `message_templates` (`group_id`,`language`);