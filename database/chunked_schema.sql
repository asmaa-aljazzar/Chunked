-- CHUNKED FULL SYSTEM STARTER SCHEMA
-- Compatible with XAMPP MariaDB 10.4 and MySQL 8.x.
-- Fresh-install script: create/select a new, empty database before running.
-- It creates `chunked` if needed and does not drop any table or database.
-- Demo accounts use invalid password placeholders and cannot sign in.
-- Date rules (for example, rejecting newly created tasks/goals in the past)
-- must also be enforced in the PHP backend; a schema alone cannot enforce the UI rule.

CREATE DATABASE IF NOT EXISTS `chunked`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `chunked`;

-- Accounts and product access
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `display_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `account_status` ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  `email_verified_at` DATETIME NULL,
  `remember_token` VARCHAR(100) NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_status_created` (`account_status`,`created_at`),
  KEY `ix_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `plan_type` ENUM('free','premium') NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `billing_interval` ENUM('none','month','year') NOT NULL DEFAULT 'none',
  `ai_chat_daily_limit` INT UNSIGNED NOT NULL DEFAULT 0,
  `ai_reorganize_daily_limit` INT UNSIGNED NOT NULL DEFAULT 0,
  `ai_compare_weekly_limit` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plans_name_interval` (`name`,`billing_interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('active','trial','canceled','expired','past_due') NOT NULL,
  `started_at` DATETIME NOT NULL,
  `ends_at` DATETIME NULL,
  `canceled_at` DATETIME NULL,
  `provider_ref` VARCHAR(190) NULL,
  `demo_key` VARCHAR(80) NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscriptions_provider_ref` (`provider_ref`),
  UNIQUE KEY `uq_subscriptions_demo_key` (`demo_key`),
  KEY `ix_subscriptions_user_status` (`user_id`,`status`,`ends_at`),
  KEY `ix_subscriptions_plan_status` (`plan_id`,`status`),
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Themes and personal preferences
CREATE TABLE IF NOT EXISTS `themes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `theme_key` VARCHAR(40) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `theme_type` ENUM('base','seasonal','style','event') NOT NULL DEFAULT 'base',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_themes_key` (`theme_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `theme_id` BIGINT UNSIGNED NULL,
  `theme_mode` ENUM('light','dark') NOT NULL DEFAULT 'light',
  `onboarded` TINYINT(1) NOT NULL DEFAULT 0,
  `language` ENUM('en','ar') NOT NULL DEFAULT 'en',
  `accent_color` VARCHAR(24) NULL,
  `density` ENUM('comfortable','compact') NOT NULL DEFAULT 'comfortable',
  `nav_style` ENUM('sidebar','top') NOT NULL DEFAULT 'sidebar',
  `enabled_modules` JSON NULL,
  `city` VARCHAR(120) NULL,
  `country` VARCHAR(120) NULL,
  `timezone` VARCHAR(80) NOT NULL DEFAULT 'UTC',
  `calculation_method` VARCHAR(80) NULL,
  `prayer_offsets` JSON NULL,
  `prayer_notifications` TINYINT(1) NOT NULL DEFAULT 0,
  `ai_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `ai_bio` TEXT NULL,
  `energy_pattern` ENUM('morning','evening','varies') NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_settings_user` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_settings_theme` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theme_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `theme_id` BIGINT UNSIGNED NOT NULL,
  `activated_by` BIGINT UNSIGNED NULL,
  `starts_on` DATE NOT NULL,
  `ends_on` DATE NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_theme_events_active_dates` (`is_active`,`starts_on`,`ends_on`),
  CONSTRAINT `fk_theme_events_theme` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_theme_events_actor` FOREIGN KEY (`activated_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dashboard_widgets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `widget_key` VARCHAR(80) NOT NULL,
  `position` INT UNSIGNED NOT NULL DEFAULT 0,
  `size` ENUM('sm','md','lg','xl','full') NOT NULL DEFAULT 'md',
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dashboard_widget_user_key` (`user_id`,`widget_key`),
  KEY `ix_dashboard_widget_order` (`user_id`,`position`),
  CONSTRAINT `fk_dashboard_widgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DAY: a user's prayer/custom periods and dated task list
CREATE TABLE IF NOT EXISTS `day_period_types` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `period_key` VARCHAR(30) NOT NULL,
  `default_name` VARCHAR(60) NOT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_day_period_types_key` (`period_key`),
  UNIQUE KEY `uq_day_period_types_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_day_preferences` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `organization_mode` ENUM('prayer','custom') NOT NULL DEFAULT 'prayer',
  `current_period_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_day_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
  -- The period FK is added after user_day_periods is created below.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_day_periods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `period_type_id` BIGINT UNSIGNED NULL,
  `period_key` VARCHAR(40) NOT NULL,
  `display_name` VARCHAR(80) NOT NULL,
  `starts_at` TIME NULL,
  `ends_at` TIME NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_day_period_key` (`user_id`,`period_key`),
  UNIQUE KEY `uq_user_day_period_order` (`user_id`,`sort_order`),
  KEY `ix_user_day_period_type` (`period_type_id`),
  CONSTRAINT `fk_user_day_periods_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_day_periods_type` FOREIGN KEY (`period_type_id`) REFERENCES `day_period_types` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `day_period_overrides` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `period_id` BIGINT UNSIGNED NOT NULL,
  `local_date` DATE NOT NULL,
  `starts_at` TIME NULL,
  `ends_at` TIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_period_override_date` (`period_id`,`local_date`),
  KEY `ix_period_override_user_date` (`user_id`,`local_date`),
  CONSTRAINT `fk_period_overrides_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_period_overrides_period` FOREIGN KEY (`period_id`) REFERENCES `user_day_periods` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `interests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `notes` TEXT NULL,
  `status` ENUM('saved','main','completed','archived') NOT NULL DEFAULT 'saved',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_interests_user_status` (`user_id`,`status`,`sort_order`),
  CONSTRAINT `fk_interests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `parent_goal_id` BIGINT UNSIGNED NULL,
  `interest_id` BIGINT UNSIGNED NULL,
  `demo_key` VARCHAR(80) NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `goal_type` ENUM('main','supportive') NOT NULL DEFAULT 'main',
  `status` ENUM('active','paused','completed','archived') NOT NULL DEFAULT 'active',
  `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `target_date` DATE NULL,
  `completed_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_goals_user_demo_key` (`user_id`,`demo_key`),
  KEY `ix_goals_user_status_target` (`user_id`,`status`,`target_date`),
  KEY `ix_goals_parent` (`parent_goal_id`),
  CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_goals_parent` FOREIGN KEY (`parent_goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_goals_interest` FOREIGN KEY (`interest_id`) REFERENCES `interests` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `milestones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `goal_id` BIGINT UNSIGNED NOT NULL,
  `demo_key` VARCHAR(80) NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `is_done` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_milestone_goal_demo_key` (`goal_id`,`demo_key`),
  KEY `ix_milestones_order` (`goal_id`,`sort_order`),
  CONSTRAINT `fk_milestones_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `period_id` BIGINT UNSIGNED NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `source_template_id` BIGINT UNSIGNED NULL,
  `demo_key` VARCHAR(80) NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `planned_date` DATE NOT NULL,
  `priority` ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  `effort_minutes` SMALLINT UNSIGNED NULL,
  `status` ENUM('open','done','postponed','archived') NOT NULL DEFAULT 'open',
  `moved_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tasks_user_demo_key` (`user_id`,`demo_key`),
  KEY `ix_tasks_user_date_status` (`user_id`,`planned_date`,`status`,`sort_order`),
  KEY `ix_tasks_period_date` (`period_id`,`planned_date`),
  KEY `ix_tasks_goal` (`goal_id`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_period` FOREIGN KEY (`period_id`) REFERENCES `user_day_periods` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
  -- The template FK is added after templates is created below.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `event_type` ENUM('created','edited','completed','reopened','postponed','reassigned','deleted') NOT NULL,
  `from_value` VARCHAR(120) NULL,
  `to_value` VARCHAR(120) NULL,
  `event_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON NULL,
  PRIMARY KEY (`id`),
  KEY `ix_task_events_task_time` (`task_id`,`event_at`),
  CONSTRAINT `fk_task_events_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `demo_key` VARCHAR(80) NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `frequency` ENUM('daily','selected_days') NOT NULL DEFAULT 'daily',
  `target_per_week` TINYINT UNSIGNED NULL,
  `start_date` DATE NOT NULL,
  `status` ENUM('active','paused','archived') NOT NULL DEFAULT 'active',
  `longest_streak` INT UNSIGNED NOT NULL DEFAULT 0,
  `archived_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_habits_user_demo_key` (`user_id`,`demo_key`),
  KEY `ix_habits_user_status` (`user_id`,`status`),
  KEY `ix_habits_goal` (`goal_id`),
  CONSTRAINT `fk_habits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_habits_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_schedule_days` (
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `weekday` TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday through 6=Saturday',
  PRIMARY KEY (`habit_id`,`weekday`),
  CONSTRAINT `fk_habit_schedule_days_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_schedule_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `frequency` ENUM('daily','selected_days') NOT NULL,
  `effective_from` DATE NOT NULL,
  `effective_to` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_habit_schedule_history_period` (`habit_id`,`effective_from`,`effective_to`),
  CONSTRAINT `fk_habit_schedule_history_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_schedule_history_days` (
  `schedule_history_id` BIGINT UNSIGNED NOT NULL,
  `weekday` TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday through 6=Saturday',
  PRIMARY KEY (`schedule_history_id`,`weekday`),
  CONSTRAINT `fk_habit_schedule_history_days_history` FOREIGN KEY (`schedule_history_id`) REFERENCES `habit_schedule_history` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_pause_periods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `starts_on` DATE NOT NULL,
  `ends_on` DATE NULL,
  `reason` VARCHAR(240) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_habit_pause_dates` (`habit_id`,`starts_on`,`ends_on`),
  CONSTRAINT `fk_habit_pause_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `log_date` DATE NOT NULL,
  `done` TINYINT(1) NOT NULL DEFAULT 1,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_habit_log_date` (`habit_id`,`log_date`),
  KEY `ix_habit_logs_date_done` (`log_date`,`done`),
  CONSTRAINT `fk_habit_logs_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FOCUS: selected focus, readiness check-ins, work sessions, and breaks
CREATE TABLE IF NOT EXISTS `focus_choices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `demo_key` VARCHAR(80) NULL,
  `choice_type` ENUM('goal','custom') NOT NULL DEFAULT 'custom',
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_focus_choices_user_demo_key` (`user_id`,`demo_key`),
  KEY `ix_focus_choices_user_active` (`user_id`,`is_active`),
  KEY `ix_focus_choices_goal` (`goal_id`),
  CONSTRAINT `fk_focus_choices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_focus_choices_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_preferences` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `selected_focus_choice_id` BIGINT UNSIGNED NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_focus_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_focus_preferences_choice` FOREIGN KEY (`selected_focus_choice_id`) REFERENCES `focus_choices` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_checkins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `focus_choice_id` BIGINT UNSIGNED NOT NULL,
  `checkin_date` DATE NOT NULL,
  `readiness` ENUM('ready','prepare','blocked') NULL,
  `explanation` VARCHAR(500) NULL,
  `next_step` VARCHAR(300) NULL,
  `estimated_time` VARCHAR(40) NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_focus_checkin_day` (`user_id`,`focus_choice_id`,`checkin_date`),
  KEY `ix_focus_checkins_date` (`user_id`,`checkin_date`),
  CONSTRAINT `fk_focus_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_focus_checkins_choice` FOREIGN KEY (`focus_choice_id`) REFERENCES `focus_choices` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `period_id` BIGINT UNSIGNED NULL,
  `task_id` BIGINT UNSIGNED NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `session_date` DATE NOT NULL,
  `planned_seconds` INT UNSIGNED NOT NULL,
  `elapsed_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('running','completed','paused','canceled') NOT NULL DEFAULT 'running',
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_focus_sessions_user_date` (`user_id`,`session_date`,`status`),
  KEY `ix_focus_sessions_period` (`period_id`,`session_date`),
  CONSTRAINT `fk_focus_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_focus_sessions_period` FOREIGN KEY (`period_id`) REFERENCES `user_day_periods` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_focus_sessions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_focus_sessions_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `break_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `focus_session_id` BIGINT UNSIGNED NULL,
  `period_id` BIGINT UNSIGNED NULL,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NULL,
  `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_break_sessions_user_started` (`user_id`,`started_at`),
  CONSTRAINT `fk_break_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_break_sessions_focus` FOREIGN KEY (`focus_session_id`) REFERENCES `focus_sessions` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_break_sessions_period` FOREIGN KEY (`period_id`) REFERENCES `user_day_periods` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GROW: supporting resources and goal changes
CREATE TABLE IF NOT EXISTS `resources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `resource_type` ENUM('link','book','course','note') NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `url` VARCHAR(2048) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_resources_user_goal` (`user_id`,`goal_id`),
  CONSTRAINT `fk_resources_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_resources_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goal_switches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `from_goal_id` BIGINT UNSIGNED NULL,
  `to_goal_id` BIGINT UNSIGNED NULL,
  `readiness_signal` ENUM('green','yellow','red') NULL,
  `reason` VARCHAR(500) NULL,
  `switched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_goal_switches_user_date` (`user_id`,`switched_at`),
  CONSTRAINT `fk_goal_switches_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_goal_switches_from` FOREIGN KEY (`from_goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_goal_switches_to` FOREIGN KEY (`to_goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reflections and optional tags
CREATE TABLE IF NOT EXISTS `reflections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `demo_key` VARCHAR(80) NULL,
  `body` TEXT NOT NULL,
  `mood` VARCHAR(40) NULL,
  `energy` VARCHAR(40) NULL,
  `entry_date` DATE NOT NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reflections_user_demo_key` (`user_id`,`demo_key`),
  KEY `ix_reflections_user_date` (`user_id`,`entry_date`),
  CONSTRAINT `fk_reflections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(60) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tags_user_name` (`user_id`,`name`),
  CONSTRAINT `fk_tags_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reflection_tags` (
  `reflection_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reflection_id`,`tag_id`),
  CONSTRAINT `fk_reflection_tags_reflection` FOREIGN KEY (`reflection_id`) REFERENCES `reflections` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_reflection_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Printable templates and marketplace
CREATE TABLE IF NOT EXISTS `template_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(90) NOT NULL,
  `description` VARCHAR(255) NULL,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_categories_name` (`name`),
  UNIQUE KEY `uq_template_categories_slug` (`slug`),
  KEY `ix_template_categories_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_by` BIGINT UNSIGNED NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `title_en` VARCHAR(160) NOT NULL,
  `title_ar` VARCHAR(160) NULL,
  `description` TEXT NOT NULL,
  `language` ENUM('en','ar','both') NOT NULL DEFAULT 'en',
  `access_type` ENUM('free','premium','paid') NOT NULL DEFAULT 'free',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `file_path` VARCHAR(500) NULL COMMENT 'Private server storage path; never expose directly without authorization.',
  `preview_image` VARCHAR(500) NULL,
  `publication_status` ENUM('draft','review','published','archived') NOT NULL DEFAULT 'draft',
  `downloads_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` DATETIME NULL,
  `archived_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_templates_slug` (`slug`),
  KEY `ix_templates_status_updated` (`publication_status`,`updated_at`),
  KEY `ix_templates_category_access_status` (`category_id`,`access_type`,`publication_status`),
  KEY `ix_templates_creator` (`created_by`),
  CONSTRAINT `fk_templates_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_templates_category` FOREIGN KEY (`category_id`) REFERENCES `template_categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `template_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('task','goal','milestone','habit','focus') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `item_data` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_template_items_order` (`template_id`,`display_order`),
  CONSTRAINT `fk_template_items_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `template_downloads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `downloaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ix_template_downloads_user_date` (`user_id`,`downloaded_at`),
  KEY `ix_template_downloads_template_date` (`template_id`,`downloaded_at`),
  CONSTRAINT `fk_template_downloads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_template_downloads_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED NULL,
  `order_type` ENUM('subscription','template_purchase') NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `status` ENUM('pending','paid','failed','refunded','canceled') NOT NULL DEFAULT 'pending',
  `provider_ref` VARCHAR(190) NULL,
  `paid_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_provider_ref` (`provider_ref`),
  KEY `ix_orders_user_date` (`user_id`,`created_at`),
  KEY `ix_orders_status_date` (`status`,`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_item_template` (`order_id`,`template_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NULL,
  `subscription_id` BIGINT UNSIGNED NULL,
  `reference_code` VARCHAR(190) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `status` ENUM('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
  `provider` VARCHAR(80) NULL,
  `processed_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transactions_reference` (`reference_code`),
  KEY `ix_transactions_user_date` (`user_id`,`created_at`),
  KEY `ix_transactions_status_date` (`status`,`created_at`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications and platform announcements
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_by` BIGINT UNSIGNED NULL,
  `announcement_key` VARCHAR(100) NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `audience` ENUM('all','free','premium','new_users') NOT NULL DEFAULT 'all',
  `status` ENUM('draft','scheduled','sent','archived') NOT NULL DEFAULT 'draft',
  `scheduled_at` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcements_key` (`announcement_key`),
  KEY `ix_announcements_status_schedule` (`status`,`scheduled_at`),
  CONSTRAINT `fk_announcements_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `announcement_id` BIGINT UNSIGNED NULL,
  `notification_type` VARCHAR(60) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `body` TEXT NULL,
  `read_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_notifications_user_unread` (`user_id`,`read_at`,`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI: user-owned conversations/messages, suggestions, and usage counters.
-- Protect these records with user consent, retention rules, and server-side access checks.
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `module` ENUM('day','grow','focus','general') NOT NULL DEFAULT 'general',
  `title` VARCHAR(180) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_ai_conversations_user_updated` (`user_id`,`updated_at`),
  CONSTRAINT `fk_ai_conversations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('user','assistant','system') NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `tokens` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_ai_messages_conversation_time` (`conversation_id`,`created_at`),
  CONSTRAINT `fk_ai_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_suggestions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `module` ENUM('day','grow','focus') NOT NULL,
  `suggestion_type` VARCHAR(80) NOT NULL,
  `payload` JSON NOT NULL,
  `reason` TEXT NULL,
  `status` ENUM('pending','accepted','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_ai_suggestions_user_status` (`user_id`,`status`,`created_at`),
  CONSTRAINT `fk_ai_suggestions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_usage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `feature` ENUM('chat','reorganize','compare') NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `usage_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_usage_user_feature_period` (`user_id`,`feature`,`period_start`,`period_end`),
  CONSTRAINT `fk_ai_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_usage_daily` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usage_date` DATE NOT NULL,
  `requests_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `success_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `error_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `average_latency_ms` INT UNSIGNED NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_usage_daily_date` (`usage_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin accountability. Never accept audit events directly from a browser.
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action_type` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `metadata` JSON NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_admin_audit_created` (`created_at`),
  KEY `ix_admin_audit_entity` (`entity_type`,`entity_id`),
  KEY `ix_admin_audit_actor` (`admin_user_id`,`created_at`),
  CONSTRAINT `fk_admin_audit_actor` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add references whose target tables are created later in this script.
ALTER TABLE `user_day_preferences`
  ADD CONSTRAINT `fk_user_day_preferences_period`
  FOREIGN KEY (`current_period_id`) REFERENCES `user_day_periods` (`id`)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_source_template`
  FOREIGN KEY (`source_template_id`) REFERENCES `templates` (`id`)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Safe baseline seeds (rerunnable; no password for these accounts will authenticate).
INSERT INTO `themes` (`theme_key`,`name`,`theme_type`,`is_active`) VALUES
  ('light','Daylight','base',1),('dark','Night','base',1),('autumn','Autumn','seasonal',1),
  ('summer','Summer','seasonal',1),('spring','Spring','seasonal',1),('winter','Winter','seasonal',1),
  ('gothic','Gothic','style',1),('ramadan','Ramadan','event',1),('eid','Eid','event',1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`theme_type`=VALUES(`theme_type`),`is_active`=1;

INSERT INTO `plans` (`name`,`plan_type`,`price`,`currency`,`billing_interval`,`ai_chat_daily_limit`,`ai_reorganize_daily_limit`,`ai_compare_weekly_limit`,`is_active`) VALUES
  ('Free','free',0.00,'USD','none',0,0,0,1),
  ('Premium monthly','premium',4.99,'USD','month',20,5,3,1),
  ('Premium yearly','premium',49.99,'USD','year',20,5,3,1)
ON DUPLICATE KEY UPDATE `plan_type`=VALUES(`plan_type`),`price`=VALUES(`price`),`currency`=VALUES(`currency`),`is_active`=1;

INSERT INTO `day_period_types` (`period_key`,`default_name`,`sort_order`) VALUES
  ('fajr','Fajr',1),('dhuhr','Dhuhr',2),('asr','Asr',3),('maghrib','Maghrib',4),('isha','Isha',5)
ON DUPLICATE KEY UPDATE `default_name`=VALUES(`default_name`),`sort_order`=VALUES(`sort_order`);

INSERT INTO `template_categories` (`name`,`slug`,`description`,`display_order`,`is_active`) VALUES
  ('DAY','day','Daily planning and gentle priorities.',1,1),('GROW','grow','Goals, milestones, and habits.',2,1),
  ('FOCUS','focus','Focus sessions and single-task planning.',3,1),('Habits','habits','Printable habit trackers.',4,1),
  ('Study','study','Study plans, revision, and learning.',5,1),('Work','work','Workday planning and project resets.',6,1),
  ('Self-care','self-care','Rest, reflection, and personal care.',7,1)
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`),`display_order`=VALUES(`display_order`),`is_active`=1;

-- Fictional accounts. The marker is not a valid password hash; do not turn these into real logins.
INSERT INTO `users` (`display_name`,`email`,`password_hash`,`role`,`account_status`,`is_demo`) VALUES
  ('Alex Morgan','alex@example.test','!DEMO_NO_LOGIN!','user','active',1),
  ('Maya Chen','maya.chen@example.test','!DEMO_NO_LOGIN!','user','active',1),
  ('Omar Haddad','omar.haddad@example.test','!DEMO_NO_LOGIN!','user','active',1),
  ('Leah Brooks','leah.brooks@example.test','!DEMO_NO_LOGIN!','user','active',1),
  ('Sam Rivera','sam.rivera@example.test','!DEMO_NO_LOGIN!','user','active',1),
  ('Demo Admin','demo-admin@example.test','!DEMO_NO_LOGIN!','admin','suspended',1)
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`),`is_demo`=1;

INSERT INTO `user_settings` (`user_id`,`theme_id`,`theme_mode`,`onboarded`,`language`,`timezone`,`enabled_modules`,`prayer_notifications`,`ai_enabled`)
SELECT u.`id`,t.`id`,'light',1,'en','Asia/Amman',JSON_ARRAY('day','grow','focus'),0,0
FROM `users` u JOIN `themes` t ON t.`theme_key`='light'
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `theme_id`=VALUES(`theme_id`),`timezone`=VALUES(`timezone`);

INSERT INTO `user_day_preferences` (`user_id`,`organization_mode`)
SELECT u.`id`,'prayer' FROM `users` u WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `organization_mode`=VALUES(`organization_mode`);

-- Sample times only; real prayer times require a location and calculation service.
INSERT INTO `user_day_periods` (`user_id`,`period_type_id`,`period_key`,`display_name`,`starts_at`,`ends_at`,`sort_order`)
SELECT u.`id`,p.`id`,p.`period_key`,p.`default_name`,seed.`starts_at`,seed.`ends_at`,p.`sort_order`
FROM `users` u
JOIN (
  SELECT 'fajr' AS `period_key`, '05:00:00' AS `starts_at`, '11:30:00' AS `ends_at`
  UNION ALL SELECT 'dhuhr','11:30:00','15:30:00'
  UNION ALL SELECT 'asr','15:30:00','18:00:00'
  UNION ALL SELECT 'maghrib','18:00:00','20:30:00'
  UNION ALL SELECT 'isha','20:30:00','05:00:00'
) seed ON 1=1
JOIN `day_period_types` p ON p.`period_key`=seed.`period_key`
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`),`starts_at`=VALUES(`starts_at`),`ends_at`=VALUES(`ends_at`),`sort_order`=VALUES(`sort_order`);

UPDATE `user_day_preferences` pref
JOIN `users` u ON u.`id`=pref.`user_id`
JOIN `user_day_periods` p ON p.`user_id`=u.`id` AND p.`period_key`='dhuhr'
SET pref.`current_period_id`=p.`id`
WHERE u.`email`='alex@example.test';

-- Sample goals; unique demo keys make this section safe to rerun.
INSERT INTO `goals` (`user_id`,`demo_key`,`title`,`description`,`goal_type`,`status`,`progress`,`is_demo`)
SELECT u.`id`,seed.`demo_key`,seed.`title`,seed.`description`,'main','active',seed.`progress`,1
FROM `users` u
JOIN (
  SELECT 'developer' AS `demo_key`,'Become a stronger full-stack developer' AS `title`,'Improve practical development skills through projects.' AS `description`,35 AS `progress`
  UNION ALL SELECT 'english','Improve my English','Become more confident communicating in English.',20
  UNION ALL SELECT 'drawing','Build a consistent drawing practice','Practice drawing through small, regular exercises.',15
) seed ON 1=1
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`description`=VALUES(`description`),`progress`=VALUES(`progress`);

INSERT INTO `milestones` (`goal_id`,`demo_key`,`title`,`description`,`sort_order`)
SELECT g.`id`,seed.`demo_key`,seed.`title`,seed.`description`,seed.`sort_order`
FROM `goals` g JOIN `users` u ON u.`id`=g.`user_id`
JOIN (
  SELECT 'developer' AS `goal_key`,'first-project' AS `demo_key`,'Complete one portfolio project' AS `title`,'Build and review a small end-to-end project.' AS `description`,1 AS `sort_order`
  UNION ALL SELECT 'developer','project-review','Review the project and note what to improve','Capture lessons for the next build.',2
) seed ON seed.`goal_key`=g.`demo_key`
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`description`=VALUES(`description`),`sort_order`=VALUES(`sort_order`);

-- Sample tasks for the current Dhuhr chunk plus one unassigned task.
INSERT INTO `tasks` (`user_id`,`period_id`,`goal_id`,`demo_key`,`title`,`planned_date`,`priority`,`effort_minutes`,`status`,`completed_at`,`sort_order`,`is_demo`)
SELECT u.`id`,p.`id`,g.`id`,seed.`demo_key`,seed.`title`,CURRENT_DATE,seed.`priority`,seed.`minutes`,seed.`status`,
       CASE WHEN seed.`status`='done' THEN CURRENT_TIMESTAMP ELSE NULL END,seed.`sort_order`,1
FROM `users` u
JOIN (
  SELECT 'draft' AS `demo_key`,'Finish the first draft' AS `title`,'high' AS `priority`,30 AS `minutes`,'open' AS `status`,1 AS `sort_order`,'dhuhr' AS `period_key`,'developer' AS `goal_key`
  UNION ALL SELECT 'email','Reply to the project email','normal',15,'open',2,'dhuhr','developer'
  UNION ALL SELECT 'stretch','Stretch for five minutes','low',5,'done',3,'dhuhr',NULL
  UNION ALL SELECT 'outline','Review the draft outline','normal',20,'open',4,'dhuhr','developer'
  UNION ALL SELECT 'section','Write the next section','high',35,'open',5,'dhuhr','developer'
  UNION ALL SELECT 'notes','Save and organize your notes','normal',10,'open',6,'dhuhr',NULL
  UNION ALL SELECT 'open-task','Check in on one open task','normal',10,'open',7,'dhuhr',NULL
  UNION ALL SELECT 'screen-break','Take a screen break','low',5,'open',8,'dhuhr',NULL
  UNION ALL SELECT 'next-step','Write down the next step','normal',10,'open',9,'dhuhr',NULL
  UNION ALL SELECT 'unscheduled','Take a short walk','low',10,'open',10,NULL,NULL
) seed ON 1=1
LEFT JOIN `user_day_periods` p ON p.`user_id`=u.`id` AND p.`period_key`=seed.`period_key`
LEFT JOIN `goals` g ON g.`user_id`=u.`id` AND g.`demo_key`=seed.`goal_key`
LEFT JOIN `tasks` existing ON existing.`user_id`=u.`id` AND existing.`demo_key`=seed.`demo_key`
WHERE u.`email`='alex@example.test' AND existing.`id` IS NULL;

-- Sample habits and their current schedule. Current streaks are calculated from logs and schedules.
INSERT INTO `habits` (`user_id`,`demo_key`,`title`,`frequency`,`start_date`,`status`,`longest_streak`,`is_demo`)
SELECT u.`id`,seed.`demo_key`,seed.`title`,'daily',DATE_SUB(CURRENT_DATE,INTERVAL 14 DAY),'active',seed.`longest_streak`,1
FROM `users` u JOIN (
  SELECT 'reading' AS `demo_key`,'Read for 15 minutes' AS `title`,5 AS `longest_streak`
  UNION ALL SELECT 'english','Practice English',3
  UNION ALL SELECT 'drawing','Draw for 10 minutes',2
) seed ON 1=1
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`frequency`='daily',`status`='active';

INSERT INTO `habit_schedule_history` (`habit_id`,`frequency`,`effective_from`)
SELECT h.`id`,'daily',h.`start_date` FROM `habits` h JOIN `users` u ON u.`id`=h.`user_id`
LEFT JOIN `habit_schedule_history` sh ON sh.`habit_id`=h.`id` AND sh.`effective_from`=h.`start_date`
WHERE u.`email`='alex@example.test' AND h.`is_demo`=1 AND sh.`id` IS NULL;

INSERT INTO `habit_logs` (`habit_id`,`log_date`,`done`,`completed_at`)
SELECT h.`id`,d.`log_date`,1,TIMESTAMP(d.`log_date`,'08:30:00')
FROM `habits` h JOIN `users` u ON u.`id`=h.`user_id`
JOIN (
  SELECT CURRENT_DATE AS `log_date` UNION ALL SELECT DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY)
  UNION ALL SELECT DATE_SUB(CURRENT_DATE,INTERVAL 2 DAY)
) d ON 1=1
WHERE u.`email`='alex@example.test' AND h.`demo_key`='reading'
ON DUPLICATE KEY UPDATE `done`=1,`completed_at`=VALUES(`completed_at`);

INSERT INTO `habit_logs` (`habit_id`,`log_date`,`done`,`completed_at`)
SELECT h.`id`,d.`log_date`,1,TIMESTAMP(d.`log_date`,'08:30:00')
FROM `habits` h JOIN `users` u ON u.`id`=h.`user_id`
JOIN (
  SELECT CURRENT_DATE AS `log_date` UNION ALL SELECT DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY)
) d ON 1=1
WHERE u.`email`='alex@example.test' AND h.`demo_key`='english'
ON DUPLICATE KEY UPDATE `done`=1,`completed_at`=VALUES(`completed_at`);

-- A linked GROW goal or independent focus can be selected; readiness is recorded per local day.
INSERT INTO `focus_choices` (`user_id`,`goal_id`,`demo_key`,`choice_type`,`title`,`description`,`is_active`,`is_demo`)
SELECT u.`id`,g.`id`,'developer-goal','goal',g.`title`,g.`description`,1,1
FROM `users` u JOIN `goals` g ON g.`user_id`=u.`id` AND g.`demo_key`='developer'
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `goal_id`=VALUES(`goal_id`),`title`=VALUES(`title`),`description`=VALUES(`description`),`is_active`=1;

INSERT INTO `focus_choices` (`user_id`,`demo_key`,`choice_type`,`title`,`description`,`is_active`,`is_demo`)
SELECT u.`id`,'demo-independent','custom','Prepare a portfolio review','Choose one project and review what is working.',1,1
FROM `users` u WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`description`=VALUES(`description`),`is_active`=1;

INSERT INTO `focus_preferences` (`user_id`,`selected_focus_choice_id`)
SELECT u.`id`,f.`id` FROM `users` u JOIN `focus_choices` f ON f.`user_id`=u.`id` AND f.`demo_key`='developer-goal'
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `selected_focus_choice_id`=VALUES(`selected_focus_choice_id`);

INSERT INTO `focus_checkins` (`user_id`,`focus_choice_id`,`checkin_date`,`readiness`,`next_step`,`estimated_time`,`is_demo`)
SELECT u.`id`,f.`id`,CURRENT_DATE,'ready','Review one JavaScript concept','20 minutes',1
FROM `users` u JOIN `focus_choices` f ON f.`user_id`=u.`id` AND f.`demo_key`='developer-goal'
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `readiness`=VALUES(`readiness`),`next_step`=VALUES(`next_step`),`estimated_time`=VALUES(`estimated_time`);

-- One fictional reflection example. Real reflections are private user content.
INSERT INTO `reflections` (`user_id`,`demo_key`,`body`,`mood`,`energy`,`entry_date`,`is_demo`)
SELECT u.`id`,'first-reflection','I made progress by choosing one small task and giving it my attention.','steady','medium',CURRENT_DATE,1
FROM `users` u WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `body`=VALUES(`body`),`entry_date`=VALUES(`entry_date`);

INSERT INTO `dashboard_widgets` (`user_id`,`widget_key`,`position`,`size`,`is_visible`)
SELECT u.`id`,w.`widget_key`,w.`position`,w.`size`,1
FROM `users` u JOIN (
  SELECT 'day_rhythm' AS `widget_key`,1 AS `position`,'full' AS `size`
  UNION ALL SELECT 'focus',2,'md'
  UNION ALL SELECT 'priorities',3,'md'
  UNION ALL SELECT 'goals',4,'md'
) w ON 1=1
WHERE u.`email`='alex@example.test'
ON DUPLICATE KEY UPDATE `position`=VALUES(`position`),`size`=VALUES(`size`),`is_visible`=1;

-- Printable template catalog (PDFs stay in private server storage).
INSERT INTO `templates` (`category_id`,`slug`,`title_en`,`description`,`language`,`access_type`,`price`,`publication_status`,`is_demo`,`published_at`)
SELECT c.`id`,seed.`slug`,seed.`title_en`,seed.`description`,'en',seed.`access_type`,seed.`price`,seed.`publication_status`,1,
       CASE WHEN seed.`publication_status`='published' THEN CURRENT_TIMESTAMP ELSE NULL END
FROM (
  SELECT 'day' AS `category_slug`,'a-calm-day-plan' AS `slug`,'A Calm Day Plan' AS `title_en`,'Shape a manageable day with thoughtful priorities and room to pause.' AS `description`,'free' AS `access_type`,0.00 AS `price`,'published' AS `publication_status`
  UNION ALL SELECT 'study','study-week','Study Week','A flexible study rhythm with focused sessions, review, and rest built in.','free',0.00,'published'
  UNION ALL SELECT 'habits','gentle-morning-routine','Gentle Morning Routine','Start with a few easy habits that help the morning feel more settled.','free',0.00,'published'
  UNION ALL SELECT 'focus','quiet-focus-sprint','Quiet Focus Sprint','A printable focus guide for one meaningful task at a time.','premium',4.99,'published'
  UNION ALL SELECT 'work','workday-reset','Workday Reset','A practical reset for planning priorities and clearing mental clutter.','premium',5.99,'review'
  UNION ALL SELECT 'self-care','small-self-care-menu','Small Self-care Menu','A gentle menu of simple ways to make a little room for yourself.','free',0.00,'draft'
) seed JOIN `template_categories` c ON c.`slug`=seed.`category_slug`
LEFT JOIN `templates` existing ON existing.`slug`=seed.`slug`
WHERE existing.`id` IS NULL;

INSERT INTO `template_items` (`template_id`,`item_type`,`title`,`description`,`display_order`)
SELECT t.`id`,seed.`item_type`,seed.`title`,seed.`description`,seed.`display_order`
FROM (
  SELECT 'a-calm-day-plan' AS `template_slug`,'task' AS `item_type`,'Choose three gentle priorities' AS `title`,'Pick a small number of meaningful tasks for today.' AS `description`,1 AS `display_order`
  UNION ALL SELECT 'a-calm-day-plan','focus','Leave room to pause','Add breathing space between planned tasks.',2
  UNION ALL SELECT 'a-calm-day-plan','task','Notice one small win','Write down one thing that moved forward.',3
) seed JOIN `templates` t ON t.`slug`=seed.`template_slug`
LEFT JOIN `template_items` existing ON existing.`template_id`=t.`id` AND existing.`title`=seed.`title`
WHERE existing.`id` IS NULL;

-- Premium demo subscriptions; other active demo users have the Free plan.
INSERT INTO `subscriptions` (`user_id`,`plan_id`,`status`,`started_at`,`ends_at`,`demo_key`,`is_demo`)
SELECT u.`id`,p.`id`,'active',CURRENT_TIMESTAMP,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 30 DAY),'demo-omar-premium',1
FROM `users` u JOIN `plans` p ON p.`name`='Premium monthly'
WHERE u.`email`='omar.haddad@example.test'
ON DUPLICATE KEY UPDATE `status`='active',`ends_at`=VALUES(`ends_at`);

INSERT INTO `subscriptions` (`user_id`,`plan_id`,`status`,`started_at`,`ends_at`,`demo_key`,`is_demo`)
SELECT u.`id`,p.`id`,'active',CURRENT_TIMESTAMP,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 365 DAY),'demo-sam-premium',1
FROM `users` u JOIN `plans` p ON p.`name`='Premium yearly'
WHERE u.`email`='sam.rivera@example.test'
ON DUPLICATE KEY UPDATE `status`='active',`ends_at`=VALUES(`ends_at`);

-- Example premium/template orders and payment ledger rows; these are not real payments.
INSERT INTO `orders` (`user_id`,`plan_id`,`order_type`,`total`,`currency`,`status`,`provider_ref`,`paid_at`,`is_demo`)
SELECT u.`id`,p.`id`,'subscription',p.`price`,p.`currency`,'paid',seed.`provider_ref`,CURRENT_TIMESTAMP,1
FROM (
  SELECT 'omar.haddad@example.test' AS `email`,'Premium monthly' AS `plan_name`,'DEMO-ORDER-1048' AS `provider_ref`
  UNION ALL SELECT 'sam.rivera@example.test','Premium yearly','DEMO-ORDER-1047'
) seed JOIN `users` u ON u.`email`=seed.`email`
JOIN `plans` p ON p.`name`=seed.`plan_name`
LEFT JOIN `orders` existing ON existing.`provider_ref`=seed.`provider_ref`
WHERE existing.`id` IS NULL;

INSERT INTO `transactions` (`user_id`,`order_id`,`reference_code`,`amount`,`currency`,`status`,`provider`,`processed_at`,`is_demo`)
SELECT o.`user_id`,o.`id`,o.`provider_ref`,o.`total`,o.`currency`,'succeeded','demo',o.`paid_at`,1
FROM `orders` o LEFT JOIN `transactions` existing ON existing.`reference_code`=o.`provider_ref`
WHERE o.`provider_ref` IN ('DEMO-ORDER-1048','DEMO-ORDER-1047') AND existing.`id` IS NULL;

INSERT INTO `announcements` (`created_by`,`announcement_key`,`title`,`message`,`audience`,`status`,`is_demo`)
VALUES
  (NULL,'demo-weekly-planning','A calmer way to plan your week','A fictional preview announcement for the admin interface.','all','draft',1),
  (NULL,'demo-study-printables','New printable study templates','A fictional sample announcement. It has not been delivered to users.','all','draft',1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`message`=VALUES(`message`),`is_demo`=1;

INSERT INTO `notifications` (`user_id`,`announcement_id`,`notification_type`,`title`,`body`)
SELECT u.`id`,a.`id`,'announcement',a.`title`,a.`message`
FROM `users` u JOIN `announcements` a ON a.`announcement_key`='demo-weekly-planning'
LEFT JOIN `notifications` n ON n.`user_id`=u.`id` AND n.`announcement_id`=a.`id`
WHERE u.`email`='alex@example.test' AND n.`id` IS NULL;

INSERT INTO `ai_usage_daily` (`usage_date`,`requests_count`,`success_count`,`error_count`,`average_latency_ms`,`is_demo`)
VALUES
  (CURRENT_DATE - INTERVAL 6 DAY,920,900,20,1810,1),(CURRENT_DATE - INTERVAL 5 DAY,1210,1190,20,1760,1),
  (CURRENT_DATE - INTERVAL 4 DAY,1080,1065,15,1790,1),(CURRENT_DATE - INTERVAL 3 DAY,1420,1390,30,1840,1),
  (CURRENT_DATE - INTERVAL 2 DAY,1310,1290,20,1770,1),(CURRENT_DATE - INTERVAL 1 DAY,1580,1545,35,1880,1),
  (CURRENT_DATE,900,885,15,1800,1)
ON DUPLICATE KEY UPDATE `requests_count`=VALUES(`requests_count`),`success_count`=VALUES(`success_count`),`error_count`=VALUES(`error_count`),`average_latency_ms`=VALUES(`average_latency_ms`),`is_demo`=1;

INSERT INTO `admin_audit_logs` (`admin_user_id`,`action_type`,`entity_type`,`entity_id`,`metadata`,`is_demo`)
SELECT u.`id`,'seeded','template',t.`id`,JSON_OBJECT('source','starter demo seed'),1
FROM `users` u JOIN `templates` t ON t.`slug`='a-calm-day-plan'
LEFT JOIN `admin_audit_logs` existing ON existing.`admin_user_id`=u.`id` AND existing.`action_type`='seeded' AND existing.`entity_type`='template' AND existing.`entity_id`=t.`id` AND existing.`is_demo`=1
WHERE u.`email`='demo-admin@example.test' AND existing.`id` IS NULL;

-- Example checks for phpMyAdmin after import.
SELECT u.`id`,u.`display_name`,u.`email`,
  CASE WHEN EXISTS (
    SELECT 1 FROM `subscriptions` s JOIN `plans` p ON p.`id`=s.`plan_id`
    WHERE s.`user_id`=u.`id` AND p.`plan_type`='premium' AND s.`status` IN ('active','trial')
      AND (s.`ends_at` IS NULL OR s.`ends_at`>=CURRENT_TIMESTAMP)
  ) THEN 'Premium' ELSE 'Free' END AS `current_plan`
FROM `users` u WHERE u.`account_status`='active' AND u.`deleted_at` IS NULL;

SELECT `publication_status`,COUNT(*) AS `template_count`
FROM `templates` WHERE `deleted_at` IS NULL GROUP BY `publication_status`;

-- Important production tasks: replace demo seed accounts; create real accounts
-- using PHP password_hash(); use prepared statements; enforce ownership and
-- admin authorization server-side; validate all dates in the user's timezone;
-- keep template PDFs in private storage; define AI consent and retention rules.
