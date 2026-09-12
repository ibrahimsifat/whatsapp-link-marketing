CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`ip` text DEFAULT 'unknown' NOT NULL,
	`success` integer DEFAULT false NOT NULL,
	`user_agent` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_attempts_ip_created` ON `auth_attempts` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_auth_attempts_email_created` ON `auth_attempts` (`email`,`created_at`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`original` text NOT NULL,
	`normalized` text NOT NULL,
	`whatsapp_link` text NOT NULL,
	`company_name` text,
	`company_category` text,
	`website` text,
	`has_website` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`sent_at` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`notes` text,
	`dynamic_data` text,
	`import_batch_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_contacts_status" CHECK("contacts"."status" IN ('pending', 'sent', 'not_sent'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_contacts_normalized` ON `contacts` (`normalized`);--> statement-breakpoint
CREATE INDEX `idx_contacts_status` ON `contacts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_contacts_company_category` ON `contacts` (`company_category`);--> statement-breakpoint
CREATE INDEX `idx_contacts_has_website` ON `contacts` (`has_website`);--> statement-breakpoint
CREATE INDEX `idx_contacts_created_at` ON `contacts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_contacts_import_batch` ON `contacts` (`import_batch_id`);--> statement-breakpoint
CREATE INDEX `idx_contacts_status_created_at` ON `contacts` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`filename` text,
	`total_rows` integer DEFAULT 0 NOT NULL,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`errors` text,
	`actor` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_import_batches_created_at` ON `import_batches` (`created_at`);--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`content` text NOT NULL,
	`variables` text DEFAULT '[]' NOT NULL,
	`target_audience` text DEFAULT 'all' NOT NULL,
	`specific_category` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "ck_templates_target_audience" CHECK("message_templates"."target_audience" IN ('all', 'with_website', 'no_website', 'category_specific'))
);
--> statement-breakpoint
CREATE INDEX `idx_templates_name` ON `message_templates` (`name`);--> statement-breakpoint
CREATE INDEX `idx_templates_category` ON `message_templates` (`category`);--> statement-breakpoint
CREATE TABLE `send_history` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text,
	`contact_normalized` text NOT NULL,
	`company_name` text,
	`template_id` text,
	`message_preview` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`error` text,
	`actor` text,
	`sent_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `message_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_send_history_contact` ON `send_history` (`contact_id`);--> statement-breakpoint
CREATE INDEX `idx_send_history_normalized` ON `send_history` (`contact_normalized`);--> statement-breakpoint
CREATE INDEX `idx_send_history_sent_at` ON `send_history` (`sent_at`);