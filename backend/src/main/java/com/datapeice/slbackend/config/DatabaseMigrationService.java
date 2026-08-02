package com.datapeice.slbackend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Handles schema changes that Hibernate ddl-auto=update cannot do automatically
 * (e.g., changing column types from varchar(255) to TEXT).
 */
@Component
public class DatabaseMigrationService implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Convert text columns that may have been created as VARCHAR(255)
        alterColumnToText("users", "avatar_url");
        alterColumnToText("users", "bio");
        alterColumnToText("users", "ban_reason");
        // Add new columns that may be missing in older deployments
        addColumnIfNotExists("users", "discord_verified", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("users", "discord_user_id", "VARCHAR(255)");
        addColumnIfNotExists("users", "last_login_time1", "TIMESTAMP");
        addColumnIfNotExists("users", "last_login_time2", "TIMESTAMP");
        addColumnIfNotExists("users", "ban_expires_at", "TIMESTAMP");
        addColumnIfNotExists("users", "total_donated", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfNotExists("site_settings", "maintenance_mode", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("site_settings", "sponsorship_goal_enabled", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("site_settings", "sponsorship_goal_target", "INTEGER NOT NULL DEFAULT 5000");
        addColumnIfNotExists("site_settings", "sponsorship_goal_current", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfNotExists("site_settings", "sponsorship_goal_text", "VARCHAR(255) DEFAULT 'На оплату хостинга'");
        addColumnIfNotExists("site_settings", "top_donator_name1", "VARCHAR(255) DEFAULT 'Игрок 1'");
        addColumnIfNotExists("site_settings", "top_donator_amount1", "INTEGER NOT NULL DEFAULT 1500");
        addColumnIfNotExists("site_settings", "top_donator_name2", "VARCHAR(255) DEFAULT 'Игрок 2'");
        addColumnIfNotExists("site_settings", "top_donator_amount2", "INTEGER NOT NULL DEFAULT 1000");
        addColumnIfNotExists("site_settings", "top_donator_name3", "VARCHAR(255) DEFAULT 'Игрок 3'");
        addColumnIfNotExists("site_settings", "top_donator_amount3", "INTEGER NOT NULL DEFAULT 500");
        addColumnIfNotExists("site_settings", "sponsorship_history_migrated", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("bot_messages", "is_from_player", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("bot_messages", "is_read", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("warnings", "expires_at", "TIMESTAMP");
        addColumnIfNotExists("bot_messages", "reactions", "TEXT");
        addColumnIfNotExists("site_settings", "review_reminder_app_accepted", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("site_settings", "review_reminder_app_accepted_days", "INTEGER NOT NULL DEFAULT 7");
        addColumnIfNotExists("site_settings", "review_reminder_sponsorship_purchased", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfNotExists("site_settings", "review_reminder_sponsorship_days", "INTEGER NOT NULL DEFAULT 3");
        createWarningsTableIfNotExists();
        createSiteSettingsTableIfNotExists();
        createReviewsTablesIfNotExists();
        createGloryItemsTableIfNotExists();
        createServerHistoriesTableIfNotExists();
        createFeatureFlagsTableIfNotExists();
        ensureServerHistoryColumns();
        seedInitialGloryItems();
        seedInitialServerHistories();
        seedInitialFeatureFlags();
    }

    /**
     * Alters a column to TEXT type unconditionally (if it exists and is not already TEXT).
     */
    private void alterColumnToText(String table, String column) {
        try {
            jdbcTemplate.execute(
                "DO $$ BEGIN " +
                "IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '" + table + "' " +
                "AND column_name = '" + column + "' AND data_type != 'text') THEN " +
                "EXECUTE 'ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT'; " +
                "END IF; END $$;"
            );
            logger.info("Column migration checked (->TEXT): {}.{}", table, column);
        } catch (Exception e) {
            logger.warn("Could not migrate column {}.{} to TEXT: {}", table, column, e.getMessage());
        }
    }

    /**
     * Adds a column to a table if it doesn't already exist.
     */
    private void addColumnIfNotExists(String table, String column, String definition) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + definition);
            logger.info("Column existence checked: {}.{}", table, column);
        } catch (Exception e) {
            logger.warn("Could not add column {}.{}: {}", table, column, e.getMessage());
        }
    }

    private void createWarningsTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS warnings (
                    id SERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    admin_id BIGINT NOT NULL,
                    admin_name VARCHAR(255) NOT NULL,
                    reason TEXT,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
                """);
            logger.info("warnings table ensured");
        } catch (Exception e) {
            logger.warn("Could not create warnings table: {}", e.getMessage());
        }
    }

    private void createSiteSettingsTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS site_settings (
                    id BIGINT PRIMARY KEY,
                    max_warnings_before_ban INTEGER NOT NULL DEFAULT 3,
                    auto_ban_on_max_warnings BOOLEAN NOT NULL DEFAULT TRUE,
                    send_email_on_warning BOOLEAN NOT NULL DEFAULT TRUE,
                    send_discord_dm_on_warning BOOLEAN NOT NULL DEFAULT TRUE,
                    send_email_on_ban BOOLEAN NOT NULL DEFAULT TRUE,
                    send_discord_dm_on_ban BOOLEAN NOT NULL DEFAULT TRUE,
                    send_email_on_application_approved BOOLEAN NOT NULL DEFAULT TRUE,
                    send_email_on_application_rejected BOOLEAN NOT NULL DEFAULT TRUE,
                    applications_open BOOLEAN NOT NULL DEFAULT TRUE,
                    registration_open BOOLEAN NOT NULL DEFAULT TRUE,
                    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
                    sponsorship_goal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                    sponsorship_goal_target INTEGER NOT NULL DEFAULT 5000,
                    sponsorship_goal_current INTEGER NOT NULL DEFAULT 0,
                    sponsorship_goal_text VARCHAR(255) DEFAULT 'На оплату хостинга',
                    top_donator_name1 VARCHAR(255) DEFAULT 'Игрок 1',
                    top_donator_amount1 INTEGER NOT NULL DEFAULT 1500,
                    top_donator_name2 VARCHAR(255) DEFAULT 'Игрок 2',
                    top_donator_amount2 INTEGER NOT NULL DEFAULT 1000,
                    top_donator_name3 VARCHAR(255) DEFAULT 'Игрок 3',
                    top_donator_amount3 INTEGER NOT NULL DEFAULT 500
                )
                """);
            logger.info("site_settings table ensured");
        } catch (Exception e) {
            logger.warn("Could not create site_settings table: {}", e.getMessage());
        }
    }

    private void createReviewsTablesIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id SERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    rating INTEGER NOT NULL DEFAULT 5,
                    content TEXT NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
                    edited_at TIMESTAMP,
                    admin_reply TEXT,
                    admin_reply_author_name VARCHAR(255),
                    admin_replied_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS review_edit_histories (
                    id SERIAL PRIMARY KEY,
                    review_id BIGINT NOT NULL,
                    rating INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """);
            logger.info("reviews and review_edit_histories tables ensured");
        } catch (Exception e) {
            logger.warn("Could not create reviews tables: {}", e.getMessage());
        }
    }

    private void createGloryItemsTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS glory_items (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(255) NOT NULL DEFAULT 'Legends',
                    image TEXT,
                    description TEXT,
                    details TEXT,
                    discord VARCHAR(255),
                    links_json TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    active BOOLEAN NOT NULL DEFAULT TRUE
                )
                """);
            logger.info("glory_items table ensured");
        } catch (Exception e) {
            logger.warn("Could not create glory_items table: {}", e.getMessage());
        }
    }

    private void createServerHistoriesTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS server_histories (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    path_slug VARCHAR(255) NOT NULL UNIQUE,
                    event_date VARCHAR(255),
                    feature_online VARCHAR(255),
                    feature_platform VARCHAR(255),
                    feature_work_time VARCHAR(255),
                    feature_runtime VARCHAR(255),
                    colors_json TEXT,
                    content_html TEXT,
                    photos_json TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    published BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
            logger.info("server_histories table ensured");
        } catch (Exception e) {
            logger.warn("Could not create server_histories table: {}", e.getMessage());
        }
    }

    private void ensureServerHistoryColumns() {
        addColumnIfNotExists("server_histories", "feature_online", "VARCHAR(255)");
        addColumnIfNotExists("server_histories", "feature_platform", "VARCHAR(255)");
        addColumnIfNotExists("server_histories", "feature_work_time", "VARCHAR(255)");
        addColumnIfNotExists("server_histories", "feature_runtime", "VARCHAR(255)");
    }

    private void seedInitialGloryItems() {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM glory_items", Integer.class);
            if (count != null && count == 0) {
                jdbcTemplate.execute("""
                    INSERT INTO glory_items (name, category, image, description, details, discord, links_json, sort_order, active) VALUES
                    ('Mr. Yan', 'Legends', 'yan.webp', 'Создатель всей истории серверов.', 'Легендарный основатель, заложивший первые камни в фундамент этого мира. Именно он стал причиной существования нашего сервера! Помним и почитаем!', NULL, '[]', 1, true),
                    ('LendSpele', 'Legends', 'lendspele.webp', 'Перенял сервер, держит его дальше.', 'Текущий владелец и технический администратор. Неустанно работает над улучшением игрового процесса, исправлением багов и внедрением новых захватывающих функций. Хранитель семени, стабильности и порядка.', 'lendspele_', '[{"name":"YouTube","url":"https://www.youtube.com/@StoryLegends77"}]', 2, true),
                    ('SevenElvn', 'Legends', 'sevenelvn.webp', 'Легенда 711, активит на сервере и делает всякие интересные вещи.', 'Известен своим старательным строительством и креативным подходом к игре. Его присутствие на сервере всегда знаменуется чем-то масштабным и интересным. Приятный тип. 711', '7il777', '[{"name":"YouTube","url":"https://www.youtube.com/@SevenElvn711"}]', 3, true),
                    ('Yap_s', 'Legends', 'yaps.webp', 'Киси киси мяу мяу, старый игрок', 'Ветеран сервера, который видел многие эпохи. Дружелюбный и общительный, всегда готов помочь новичкам или рассказать интересную историю из прошлого, если помнит. Мяу!', 'yappy_yaps', '[{"name":"YouTube","url":"https://www.youtube.com/@Yaps_Games"}]', 4, true),
                    ('datapeice', 'Legends', 'datapeice.webp', 'Java, Poland, Mimi lover<3.', 'Принёс на сервер модовую революцию! Без него сервер бы не имел прекрасные механики и выглядил бы иначе. Мотиватор Владельцу! И кто нибудь, найдите ему уже Польскую альтушку!', 'datapeice', '[]', 5, true),
                    ('KeroVoid', 'Legends', 'kerovoid.webp', 'Главный фанат лора.', 'Шерлок, лоровед, любитель хорошей девочки - Коллет. И просто хороший тип. Эбу Абу эУ ЫА уа.', 'goo9le1', '[]', 6, true),
                    ('FixAlex555', 'ContenMakers', 'fixalex555.webp', 'Стример.', 'Стримит будни сервера на своем Twitch канале.', 'fpv.fixalex555', '[{"name":"Twitch","url":"https://www.twitch.tv/fixalex555"}]', 7, true),
                    ('bbbsss_UwU', 'ContenMakers', 'bbbsss_uwu.webp', 'Twitch стример.', 'Запускает трансляции на Twitch и проводит свои будни стримера в нашей атмосфере.', 'fame.akira', '[{"name":"Twitch","url":"https://www.twitch.tv/fayncovers"}]', 8, true),
                    ('_MrZippy_', 'ContenMakers', 'mrzippy.webp', 'Контентмейкер.', 'Показывает жизнь сервера на своих трансляциях.', 'mrzippy0', '[{"name":"Twitch","url":"https://www.twitch.tv/0mrzippy"}]', 9, true);
                    """);
                logger.info("Initial glory items seeded successfully");
            }
        } catch (Exception e) {
            logger.warn("Could not seed glory items: {}", e.getMessage());
        }
    }

    private void seedInitialServerHistories() {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM server_histories", Integer.class);
            if (count != null && count == 0) {
                jdbcTemplate.execute("""
                INSERT INTO server_histories (title, description, path_slug, event_date, feature_online, feature_platform, feature_work_time, feature_runtime, colors_json, content_html, photos_json, sort_order, published) VALUES
                ('SL Ancient Fog', 'Новые главы истории', 'sl-ancient-fog', '10-05-2025', '8-10 человек в среднем', 'Minecraft Java + Bedrock', 'Круглосуточно', '~ 3 месяца', '["#34383b","#728697"]', '<h2>Сезон SL Ancient Fog</h2><p>Новая эпоха истории сервера с туманом древности, обновлениями лора и уникальным игровым опытом.</p>', '[]', 1, true),
                ('StoryLegends SL', 'Начало легендарной истории', 'storylegends-sl', '2023-2024', '15+ человек в пике', 'Minecraft Java + Bedrock', 'Круглосуточно', '~ 8 месяцев', '["#084882","#4da5f4"]', '<h2>Становление StoryLegends</h2><p>Период укрепления сообщества и глобального развития механик выживания.</p>', '[]', 2, true),
                ('StoryMode MSM', 'Начало всей истории', 'storymode-msm', '?-04-2022', '10+ человек в пике', 'Minecraft Java', 'Круглосуточно', '~ 6 месяцев', '["#d6d020","#F59E11"]', '<h2>Первый проект StoryMode</h2><p>Зарождение первых идей, уникального игрового режима и первых участников сообщества.</p>', '[]', 3, true),
                ('StoneShield SH', 'Суровые испытания. Хардкорное выживание и борьба за ресурсы', 'stoneshield-sh', 'Дата утеряна', '6-8 человек в среднем', 'Minecraft Java', 'Круглосуточно', '~ 4 месяца', '["#78716c","#d97706"]', '<h2>Хардкорный период StoneShield</h2><p>История хардкорного выживания, кланов и противостояний за ресурсы.</p>', '[]', 4, true),
                ('2B2T Пародия', 'Анархия без правил. Полная свобода действий и хаос', '2b2t-parody', 'Дата утеряна', '20+ человек в пике', 'Minecraft Java', 'Круглосуточно', '~ 5 месяцев', '["#ef4444","#000000"]', '<h2>Анархия 2B2T</h2><p>Эпоха полной свободы действий, легендарных разрушений и спавн-комплексов.</p>', '[]', 5, true);
                    """);
                logger.info("Initial server history seeded successfully");
            } else {
                // Populate default feature fields if they were null on existing deployments
                jdbcTemplate.execute("""
                    UPDATE server_histories SET 
                        feature_online = '8-10 человек в среднем',
                        feature_platform = 'Minecraft Java + Bedrock',
                        feature_work_time = 'Круглосуточно',
                        feature_runtime = '~ 3 месяца'
                    WHERE feature_online IS NULL AND (path_slug = 'sl-ancient-fog' OR path_slug = '5' OR sort_order = 1);

                    UPDATE server_histories SET 
                        feature_online = '15+ человек в пике',
                        feature_platform = 'Minecraft Java + Bedrock',
                        feature_work_time = 'Круглосуточно',
                        feature_runtime = '~ 8 месяцев'
                    WHERE feature_online IS NULL AND (path_slug = 'storylegends-sl' OR path_slug = '2' OR sort_order = 2);

                    UPDATE server_histories SET 
                        feature_online = '10+ человек в пике',
                        feature_platform = 'Minecraft Java',
                        feature_work_time = 'Круглосуточно',
                        feature_runtime = '~ 6 месяцев'
                    WHERE feature_online IS NULL AND (path_slug = 'storymode-msm' OR path_slug = '3' OR sort_order = 3);

                    UPDATE server_histories SET 
                        feature_online = '6-8 человек в среднем',
                        feature_platform = 'Minecraft Java',
                        feature_work_time = 'Круглосуточно',
                        feature_runtime = '~ 4 месяца'
                    WHERE feature_online IS NULL AND (path_slug = 'stoneshield-sh' OR path_slug = '4' OR sort_order = 4);

                    UPDATE server_histories SET 
                        feature_online = '20+ человек в пике',
                        feature_platform = 'Minecraft Java',
                        feature_work_time = 'Круглосуточно',
                        feature_runtime = '~ 5 месяцев'
                    WHERE feature_online IS NULL AND (path_slug = '2b2t-parody' OR path_slug = '1' OR path_slug = '5' OR sort_order = 5);
                """);
            }
        } catch (Exception e) {
            logger.warn("Could not seed or update server history: {}", e.getMessage());
        }
    }

    private void createFeatureFlagsTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS feature_flags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    description TEXT,
                    enabled BOOLEAN NOT NULL DEFAULT FALSE,
                    allow_admins BOOLEAN NOT NULL DEFAULT TRUE
                )
                """);
            logger.info("feature_flags table ensured");
        } catch (Exception e) {
            logger.warn("Could not create feature_flags table: {}", e.getMessage());
        }
    }

    private void seedInitialFeatureFlags() {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM feature_flags WHERE name = 'history'", Integer.class);
            if (count != null && count == 0) {
                jdbcTemplate.execute("""
                    INSERT INTO feature_flags (name, description, enabled, allow_admins) VALUES
                    ('history', 'Включает динамическую загрузку истории из базы данных (с fallback на файлы)', true, true)
                    """);
                logger.info("Initial 'history' feature flag seeded successfully");
            }
        } catch (Exception e) {
            logger.warn("Could not seed 'history' feature flag: {}", e.getMessage());
        }
    }
}
