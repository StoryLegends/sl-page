package com.datapeice.slbackend.service;

import com.datapeice.slbackend.repository.UserRepository;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.entities.channel.ChannelType;
import net.dv8tion.jda.api.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberRemoveEvent;
import net.dv8tion.jda.api.events.guild.member.update.GuildMemberUpdateAvatarEvent;
import net.dv8tion.jda.api.events.guild.member.update.GuildMemberUpdateBoostTimeEvent;
import net.dv8tion.jda.api.events.guild.member.update.GuildMemberUpdateNicknameEvent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.user.update.UserUpdateAvatarEvent;
import net.dv8tion.jda.api.events.user.update.UserUpdateGlobalNameEvent;
import net.dv8tion.jda.api.events.user.update.UserUpdateNameEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.GatewayIntent;
import net.dv8tion.jda.api.utils.MemberCachePolicy;
import net.dv8tion.jda.api.utils.messages.MessageCreateBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
public class DiscordService {

    private static final Logger logger = LoggerFactory.getLogger(DiscordService.class);

    @Value("${discord.bot.token:}")
    private String botToken;

    @Value("${discord.guild.id:}")
    private String guildId;

    @Value("${discord.sl-role.id:}")
    private String slRoleId;

    @Value("${discord.applications-channel.id:}")
    private String applicationsChannelId;

    @Value("${discord.bot.enabled:false}")
    private boolean botEnabled;

    private JDA jda;

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final RconService rconService;
    private final BotMessengerService botMessengerService;

    public DiscordService(FileStorageService fileStorageService, UserRepository userRepository, AuditLogService auditLogService,
                          RconService rconService, @org.springframework.context.annotation.Lazy BotMessengerService botMessengerService) {
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.rconService = rconService;
        this.botMessengerService = botMessengerService;
    }

    private static final String MIMI_GIF_URL = "https://tenor.com/view/mimi-typh-heart-sit-mimi-the-dog-gif-13978401409055125823";
    private static final String DATAPEICE_IMAGE_URL = "https://i.imgur.com/5hbmB3v.png";
    private static final String ROXY_GIF_URL = "https://tenor.com/bvLHN.gif";
    private static final String ANGRY_PING = "<:angryping:1121035024179933204>";
    private static final String MILKY_GIF_URL = "https://tenor.com/view/%D7%9E%D7%99%D7%9C%D7%A7%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C-%D7%A0%D7%92%D7%91-%D7%A2%D7%91%D7%A8%D7%99%D7%AA-negev-gif-8641426212027285266";

    private static final Set<String> MILKY_KEYWORDS = Set.of(
            "Биби", "Нетаньяху", "Сионизм", "Сионист", "ЦАХАЛ", "Моссад", "Газа", "Хамас", "Палестина", "Палантир",
            "Оракл", "Апартеид", "Оккупация", "Хасбара", "Яхуд", "Интифада", "Накба", "Поселенцы", "Нимбус",
            "Железный купол",
            "Bibi", "Netanyahu", "Zionism", "Zionist", "IDF", "Mossad", "Gaza", "Hamas", "Palestine", "Palantir",
            "Oracle", "Apartheid", "Occupation", "Hasbara", "Yahood", "Intifada", "Nakba", "Settlers", "Nimbus",
            "Iron Dome", "Израил", "Israel", "шекел", "shekel");

    /**
     * JDA event listener that fires when a Discord user changes their username or
     * global name.
     * Finds the matching site user by discordUserId and updates their
     * discordNickname.
     */
    private class NicknameListener extends ListenerAdapter {

        @Override
        public void onUserUpdateName(UserUpdateNameEvent event) {
            String discordUserId = event.getUser().getId();
            String newName = event.getNewName();
            syncNickname(discordUserId, newName, "username");
        }

        @Override
        public void onUserUpdateGlobalName(UserUpdateGlobalNameEvent event) {
            String discordUserId = event.getUser().getId();
            String newGlobalName = event.getNewGlobalName();
            if (newGlobalName == null) {
                newGlobalName = event.getUser().getName();
            }
            syncNickname(discordUserId, newGlobalName, "global_name");
        }

        private void syncNickname(String discordUserId, String newNickname, String source) {
            try {
                userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                    String oldNickname = user.getDiscordNickname();
                    if (!newNickname.equals(oldNickname)) {
                        user.setDiscordNickname(newNickname);
                        userRepository.save(user);
                        logger.info("Auto-synced Discord {} for userId={}: '{}' -> '{}'",
                                source, discordUserId, oldNickname, newNickname);
                    }
                });
            } catch (Exception e) {
                logger.error("Failed to sync Discord nickname for userId={}: {}", discordUserId, e.getMessage());
            }
        }

        @Override
        public void onUserUpdateAvatar(UserUpdateAvatarEvent event) {
            String discordUserId = event.getUser().getId();
            try {
                userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                    String newAvatarUrl = syncDiscordAvatar(discordUserId);
                    if (newAvatarUrl != null) {
                        user.setAvatarUrl(newAvatarUrl);
                        userRepository.save(user);
                        logger.info("Auto-synced Discord avatar for userId={}", discordUserId);
                    }
                });
            } catch (Exception e) {
                logger.error("Failed to sync Discord avatar for userId={}: {}", discordUserId, e.getMessage());
            }
        }

        @Override
        public void onGuildMemberUpdateNickname(GuildMemberUpdateNicknameEvent event) {
            if (event.getGuild().getId().equals(guildId)) {
                String discordUserId = event.getUser().getId();
                String newNickname = event.getNewNickname();
                if (newNickname == null) {
                    newNickname = event.getMember().getUser().getName(); // fallback
                }
                syncNickname(discordUserId, newNickname, "guild_nickname");
            }
        }

        @Override
        public void onGuildMemberUpdateAvatar(GuildMemberUpdateAvatarEvent event) {
            if (event.getGuild().getId().equals(guildId)) {
                String discordUserId = event.getUser().getId();
                try {
                    userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                        String newAvatarUrl = syncDiscordAvatar(discordUserId);
                        if (newAvatarUrl != null) {
                            user.setAvatarUrl(newAvatarUrl);
                            userRepository.save(user);
                            logger.info("Auto-synced Discord guild avatar for userId={}", discordUserId);
                        }
                    });
                } catch (Exception e) {
                    logger.error("Failed to sync Discord guild avatar for userId={}: {}", discordUserId,
                            e.getMessage());
                }
            }
        }
    }

    private class MessageListener extends ListenerAdapter {
        @Override
        public void onMessageReceived(MessageReceivedEvent event) {
            if (event.getAuthor().isBot())
                return;

            if (event.isFromType(ChannelType.PRIVATE)) {
                String discordUserId = event.getAuthor().getId();
                String rawText = event.getMessage().getContentRaw();
                String mediaUrl = null;

                if (!event.getMessage().getAttachments().isEmpty()) {
                    Message.Attachment att = event.getMessage().getAttachments().get(0);
                    mediaUrl = att.getUrl();
                }

                try {
                    botMessengerService.processIncomingPlayerMessage(discordUserId, event.getAuthor().getName(), rawText, mediaUrl, event.getMessageId());
                } catch (Exception e) {
                    logger.error("Error processing incoming player DM from {}: {}", discordUserId, e.getMessage());
                }
            }

            String content = event.getMessage().getContentDisplay().toLowerCase();
            // mimi/мими пасхалка
            if (content.contains("mimi") || content.contains("мими")) {
                event.getMessage().reply(MIMI_GIF_URL).queue();
                return;
            }
            String rawContent = event.getMessage().getContentRaw().toLowerCase();

            // @datapeice пасхалка
            if (rawContent.contains("<@861896140617809920>") || rawContent.contains("<@!861896140617809920>")) {
                event.getMessage().reply(DATAPEICE_IMAGE_URL).queue();
            }

            // @lendspele_ пасхалка
            if (rawContent.contains("<@881159130990129212>") || rawContent.contains("<@!881159130990129212>")) {
                event.getMessage().reply(ANGRY_PING).queue();
            }
            // Roxy/Migurdia пасхалка
            if (content.contains("рокси") || content.contains("migurdia") || content.contains("roxy")
                    || content.contains("мигурдия")) {
                event.getMessage().reply(ROXY_GIF_URL).queue();
            }

            for (String keyword : MILKY_KEYWORDS) {
                if (content.contains(keyword.toLowerCase())) {
                    event.getMessage().reply(MILKY_GIF_URL).queue();
                    break;
                }
            }
        }
    }

    private class MemberLeaveListener extends ListenerAdapter {
        @Override
        public void onGuildMemberRemove(GuildMemberRemoveEvent event) {
            if (event.getGuild().getId().equals(guildId)) {
                String discordUserId = event.getUser().getId();
                try {
                    userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                        // user.setDiscordVerified(false);
                        // user.setDiscordUserId(null);
                        user.setInDiscord(false);
                        // Опционально: если вы хотите также убирать isPlayer:
                        // user.setPlayer(false); нафиг надо, потому что человек может вернуться в
                        // дискорд и он вернет статус игрока, а так с так был бы дополнительный геморой
                        // админам
                        // TODO добавить удаление игрока с whitelist через rcon
                        rconService.removePlayerFromWhitelist(user.getMinecraftNickname());
                        userRepository.save(user);
                        try {
                            auditLogService.logAction(user.getId(), user.getUsername(), "DISCORD_LEAVE",
                                    "Покинул сервер Discord", user.getId(), user.getUsername());
                        } catch (Exception auditEx) {
                            logger.warn("Could not log DISCORD_LEAVE action", auditEx);
                        }
                        logger.info("Discord user {} left the guild. Updated inDiscord to false for user {}",
                                discordUserId, user.getUsername());
                    });
                } catch (Exception e) {
                    logger.error("Failed to handle guild member remove for discordUserId={}: {}", discordUserId,
                            e.getMessage());
                }
            }
        }
    }

    private class MemberJoinListener extends ListenerAdapter {
        @Override
        public void onGuildMemberJoin(GuildMemberJoinEvent event) {
            if (event.getGuild().getId().equals(guildId)) {
                String discordUserId = event.getUser().getId();
                try {
                    userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                        user.setInDiscord(true);
                        userRepository.save(user);

                        logger.info("Discord user {} joined the guild. Updated inDiscord to true for user {}",
                                discordUserId, user.getUsername());
                    });
                } catch (Exception e) {
                    logger.error("Failed to handle guild member join for discordUserId={}: {}", discordUserId,
                            e.getMessage());
                }
            }
        }
    }

    private class MemberBoostListener extends ListenerAdapter {
        @Override
        public void onGuildMemberUpdateBoostTime(GuildMemberUpdateBoostTimeEvent event) {
            if (event.getGuild().getId().equals(guildId)) {
                String discordUserId = event.getUser().getId();
                boolean isBoosting = event.getNewTimeBoosted() != null;
                try {
                    userRepository.findByDiscordUserId(discordUserId).ifPresent(user -> {
                        if (user.isBoosted() != isBoosting) {
                            user.setBoosted(isBoosting);
                            userRepository.save(user);
                            logger.info("Discord user {} boost status updated to {} via event", discordUserId, isBoosting);
                        }
                    });
                } catch (Exception e) {
                    logger.error("Failed to handle guild member boost update for discordUserId={}: {}", discordUserId, e.getMessage());
                }
            }
        }
    }

    @PostConstruct
    public void init() {
        if (!botEnabled || botToken.isBlank()) {
            logger.info("Discord bot is disabled or token not configured");
            return;
        }
        try {
            jda = JDABuilder.createDefault(botToken)
                    .enableIntents(
                            GatewayIntent.GUILD_MEMBERS,
                            GatewayIntent.GUILD_MESSAGES,
                            GatewayIntent.DIRECT_MESSAGES,
                            GatewayIntent.MESSAGE_CONTENT)
                    .setMemberCachePolicy(MemberCachePolicy.ALL)
                    .setChunkingFilter(net.dv8tion.jda.api.utils.ChunkingFilter.ALL)
                    .addEventListeners(new NicknameListener())
                    .addEventListeners(new MessageListener())
                    .addEventListeners(new MemberJoinListener())
                    .addEventListeners(new MemberLeaveListener())
                    .addEventListeners(new MemberBoostListener())
                    .build();
            jda.awaitReady();
            logger.info("Discord bot started successfully. Guilds: {}", jda.getGuilds().size());
            syncAllBoostStatuses();
        } catch (Exception e) {
            logger.error("Failed to start Discord bot: {}", e.getMessage());
            jda = null;
        }
    }

    private void syncAllBoostStatuses() {
        Guild guild = jda.getGuildById(guildId);
        if (guild == null) return;

        guild.loadMembers().onSuccess(members -> {
            Set<String> boostingDiscordIds = members.stream()
                    .filter(m -> m.getTimeBoosted() != null)
                    .map(net.dv8tion.jda.api.entities.Member::getId)
                    .collect(Collectors.toSet());

            List<com.datapeice.slbackend.entity.User> allUsers = userRepository.findAll();
            int updatedCount = 0;
            for (com.datapeice.slbackend.entity.User user : allUsers) {
                if (user.getDiscordUserId() != null) {
                    boolean isBoosting = boostingDiscordIds.contains(user.getDiscordUserId());
                    if (user.isBoosted() != isBoosting) {
                        user.setBoosted(isBoosting);
                        userRepository.save(user);
                        updatedCount++;
                    }
                }
            }
            logger.info("Startup sync finished: found {} boosting members, updated {} user records", boostingDiscordIds.size(), updatedCount);
        }).onError(err -> logger.error("Failed to load members for syncAllBoostStatuses: {}", err.getMessage()));
    }

    @PreDestroy
    public void shutdown() {
        if (jda != null) {
            jda.shutdown();
        }
    }

    public boolean isEnabled() {
        return botEnabled && jda != null;
    }

    /**
     * Check if a member with the given Discord nickname is in the guild.
     * Searches by username (case-insensitive).
     */
    public boolean isMemberInGuild(String discordNickname) {
        if (!isEnabled()) {
            logger.warn("Discord bot disabled - skipping guild membership check for: {}", discordNickname);
            return true; // Allow if bot is disabled
        }
        Guild guild = jda.getGuildById(guildId);
        if (guild == null) {
            logger.error("Guild not found: {}", guildId);
            return false;
        }

        String searchName = discordNickname.toLowerCase().trim();
        // Remove discriminator if present (old Discord format user#1234)
        if (searchName.contains("#")) {
            searchName = searchName.substring(0, searchName.indexOf("#"));
        }
        final String finalSearch = searchName;

        try {
            // Force load ALL members from Discord API (not just cache)
            List<Member> members = guild.loadMembers().get();
            boolean found = members.stream().anyMatch(m -> m.getUser().getName().toLowerCase().equals(finalSearch) ||
                    (m.getNickname() != null && m.getNickname().toLowerCase().equals(finalSearch)) ||
                    (m.getUser().getGlobalName() != null
                            && m.getUser().getGlobalName().toLowerCase().equals(finalSearch)));
            logger.info("Discord guild membership check for '{}': {} (total members: {})", discordNickname, found,
                    members.size());
            return found;
        } catch (Exception e) {
            logger.error("Failed to load guild members: {}", e.getMessage());
            // On error - allow the application to proceed
            return true;
        }
    }

    /**
     * Check if a member is in the guild quickly using JDA cache or user ID.
     */
    public boolean isMemberInGuildCached(String discordUserId, String discordNickname) {
        if (!isEnabled()) {
            return false;
        }
        Guild guild = jda.getGuildById(guildId);
        if (guild == null) {
            return false;
        }

        if (discordUserId != null && !discordUserId.isBlank()) {
            net.dv8tion.jda.api.entities.Member member = guild.getMemberById(discordUserId);
            if (member != null)
                return true;
        }

        if (discordNickname != null && !discordNickname.isBlank()) {
            String searchName = discordNickname.toLowerCase().trim();
            if (searchName.contains("#")) {
                searchName = searchName.substring(0, searchName.indexOf("#"));
            }
            final String finalSearch = searchName;

            return guild.getMemberCache().stream()
                    .anyMatch(m -> m.getUser().getName().toLowerCase().equals(finalSearch) ||
                            (m.getNickname() != null && m.getNickname().toLowerCase().equals(finalSearch)) ||
                            (m.getUser().getGlobalName() != null
                                    && m.getUser().getGlobalName().toLowerCase().equals(finalSearch)));
        }
        return false;
    }

    public boolean checkMemberRest(String discordUserId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank())
            return false;
        try {
            Guild guild = jda.getGuildById(guildId);
            if (guild != null) {
                net.dv8tion.jda.api.entities.Member member = guild.retrieveMemberById(discordUserId).complete();
                return member != null;
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    /**
     * Check if a member is currently boosting the guild.
     */
    public boolean isMemberBoosting(String discordUserId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank()) {
            return false;
        }
        try {
            Guild guild = jda.getGuildById(guildId);
            if (guild != null) {
                net.dv8tion.jda.api.entities.Member member = guild.getMemberById(discordUserId);
                if (member == null) {
                    member = guild.retrieveMemberById(discordUserId).complete();
                }
                if (member != null) {
                    return member.getTimeBoosted() != null;
                }
            }
        } catch (Exception e) {
            logger.error("Failed to check if member {} is boosting: {}", discordUserId, e.getMessage());
        }
        return false;
    }

    /**
     * Find Discord user ID by nickname (username).
     */
    public Optional<String> findDiscordUserId(String discordNickname) {
        if (!isEnabled() || discordNickname == null)
            return Optional.empty();
        Guild guild = jda.getGuildById(guildId);
        if (guild == null)
            return Optional.empty();

        String searchName = discordNickname.toLowerCase().trim();
        if (searchName.contains("#")) {
            searchName = searchName.substring(0, searchName.indexOf("#"));
        }
        final String finalSearch = searchName;

        try {
            List<Member> members = guild.loadMembers().get();
            return members.stream()
                    .filter(m -> m.getUser().getName().toLowerCase().equals(finalSearch) ||
                            (m.getNickname() != null && m.getNickname().toLowerCase().equals(finalSearch)) ||
                            (m.getUser().getGlobalName() != null
                                    && m.getUser().getGlobalName().toLowerCase().equals(finalSearch)))
                    .map(m -> m.getUser().getId())
                    .findFirst();
        } catch (Exception e) {
            logger.error("Failed to find Discord user ID for {}: {}", discordNickname, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Send a private DM to a Discord user by their user ID.
     */
    public void sendDirectMessage(String discordUserId, String message) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank())
            return;
        try {
            jda.retrieveUserById(discordUserId).queue(user -> user.openPrivateChannel().queue(channel -> channel.sendMessage(message).queue(
                    success -> logger.info("DM sent to Discord user: {}", discordUserId),
                    error -> logger.error("Failed to send DM to {}: {}", discordUserId, error.getMessage()))), error -> logger.error("Failed to find Discord user {}: {}", discordUserId, error.getMessage()));
        } catch (Exception e) {
            logger.error("Error sending DM to {}: {}", discordUserId, e.getMessage());
        }
    }

    public void sendDirectMessageAndGetId(String discordUserId, String messageContent, String mediaUrl, Consumer<String> onMessageSent) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank())
            return;
        try {
            jda.retrieveUserById(discordUserId).queue(user -> user.openPrivateChannel().queue(channel -> {
                MessageCreateBuilder builder = new MessageCreateBuilder();
                if (messageContent != null && !messageContent.isBlank()) {
                    builder.setContent(messageContent);
                }
                if (mediaUrl != null && !mediaUrl.isBlank()) {
                    try {
                        URL url = new URL(mediaUrl);
                        InputStream in = url.openStream();
                        String filename = mediaUrl.contains("/") ? mediaUrl.substring(mediaUrl.lastIndexOf("/") + 1) : "attachment.png";
                        if (filename.contains("?")) filename = filename.substring(0, filename.indexOf("?"));
                        builder.addFiles(net.dv8tion.jda.api.utils.FileUpload.fromData(in, filename));
                    } catch (Exception e) {
                        logger.error("Failed to stream media for Discord attachment, falling back to text URL: {}", e.getMessage());
                        if (builder.getContent() == null || builder.getContent().isBlank()) {
                            builder.setContent(mediaUrl);
                        } else {
                            builder.setContent(builder.getContent() + "\n" + mediaUrl);
                        }
                    }
                }
                if (builder.isEmpty()) {
                    return;
                }
                channel.sendMessage(builder.build()).queue(
                    success -> {
                        logger.info("Bot DM sent to user: {}", discordUserId);
                        if (onMessageSent != null) {
                            onMessageSent.accept(success.getId());
                        }
                    },
                    error -> logger.error("Failed to send Bot DM to {}: {}", discordUserId, error.getMessage())
                );
            }), error -> logger.error("Failed to find Discord user {}: {}", discordUserId, error.getMessage()));
        } catch (Exception e) {
            logger.error("Error in sendDirectMessageAndGetId to {}: {}", discordUserId, e.getMessage());
        }
    }

    public void addReactionToDirectMessage(String discordUserId, String discordMessageId, String emoji) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank() || discordMessageId == null || discordMessageId.isBlank())
            return;
        try {
            jda.retrieveUserById(discordUserId).queue(user -> user.openPrivateChannel().queue(channel -> {
                channel.addReactionById(discordMessageId, net.dv8tion.jda.api.entities.emoji.Emoji.fromUnicode(emoji)).queue(
                    success -> logger.info("Added reaction {} to DM {}", emoji, discordMessageId),
                    error -> logger.error("Failed to add reaction to DM {}: {}", discordMessageId, error.getMessage())
                );
            }), error -> logger.error("Failed to find user for adding reaction: {}", error.getMessage()));
        } catch (Exception e) {
            logger.error("Error adding reaction to DM {}: {}", discordMessageId, e.getMessage());
        }
    }

    public void editDirectMessage(String discordUserId, String discordMessageId, String newContent, String mediaUrl) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank() || discordMessageId == null || discordMessageId.isBlank())
            return;
        try {
            String fullContent = newContent != null ? newContent : "";
            if (mediaUrl != null && !mediaUrl.isBlank()) {
                if (!fullContent.isBlank()) {
                    fullContent += "\n" + mediaUrl;
                } else {
                    fullContent = mediaUrl;
                }
            }
            final String finalContent = fullContent;
            jda.retrieveUserById(discordUserId).queue(user -> user.openPrivateChannel().queue(channel -> channel.editMessageById(discordMessageId, finalContent).queue(
                    success -> logger.info("Bot DM edited: {}", discordMessageId),
                    error -> logger.error("Failed to edit Bot DM {}: {}", discordMessageId, error.getMessage())
            )), error -> logger.error("Failed to find user for editing DM: {}", error.getMessage()));
        } catch (Exception e) {
            logger.error("Error editing DM {}: {}", discordMessageId, e.getMessage());
        }
    }

    public void deleteDirectMessage(String discordUserId, String discordMessageId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank() || discordMessageId == null || discordMessageId.isBlank())
            return;
        try {
            jda.retrieveUserById(discordUserId).queue(user -> user.openPrivateChannel().queue(channel -> channel.deleteMessageById(discordMessageId).queue(
                    success -> logger.info("Bot DM deleted: {}", discordMessageId),
                    error -> logger.error("Failed to delete Bot DM {}: {}", discordMessageId, error.getMessage())
            )), error -> logger.error("Failed to find user for deleting DM: {}", error.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting DM {}: {}", discordMessageId, e.getMessage());
        }
    }

    /**
     * Notify admins about a new application.
     * Uses discord.applications-channel.id if set, else sends DM to users with
     * ADMIN/MODERATOR roles.
     */
    public void notifyAdminsAboutNewApplication(String applicantUsername) {
        if (!isEnabled())
            return;
        String message = "📢 **Новая заявка!**\nПользователь **" + applicantUsername
                + "** подал заявку на вступление. Зайдите в Админ Панель для рассмотрения.";

        if (applicationsChannelId != null && !applicationsChannelId.isBlank()) {
            net.dv8tion.jda.api.entities.channel.concrete.TextChannel channel = jda
                    .getTextChannelById(applicationsChannelId);
            if (channel != null) {
                channel.sendMessage(message).queue();
                return;
            }
        }

        // Fallback: send DM to all admins/mods
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.datapeice.slbackend.entity.UserRole.ROLE_ADMIN
                        || u.getRole() == com.datapeice.slbackend.entity.UserRole.ROLE_MODERATOR)
                .map(com.datapeice.slbackend.entity.User::getDiscordUserId)
                .filter(id -> id != null && !id.isBlank())
                .forEach(id -> sendDirectMessage(id, message));
    }

    /**
     * Assign the @SL role to a Discord user by their user ID.
     */
    public void assignSlRole(String discordUserId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank() || slRoleId.isBlank())
            return;
        Guild guild = jda.getGuildById(guildId);
        if (guild == null)
            return;
        Role role = guild.getRoleById(slRoleId);
        if (role == null) {
            logger.error("SL role not found: {}", slRoleId);
            return;
        }
        guild.retrieveMemberById(discordUserId).queue(member -> guild.addRoleToMember(member, role).queue(
                success -> logger.info("SL role assigned to {}", discordUserId),
                error -> logger.error("Failed to assign SL role to {}: {}", discordUserId, error.getMessage())), error -> logger.error("Member not found: {}", discordUserId));
    }

    /**
     * Remove the @SL role from a Discord user.
     */
    public void removeSlRole(String discordUserId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank() || slRoleId.isBlank())
            return;
        Guild guild = jda.getGuildById(guildId);
        if (guild == null)
            return;
        Role role = guild.getRoleById(slRoleId);
        if (role == null)
            return;
        guild.retrieveMemberById(discordUserId).queue(member -> guild.removeRoleFromMember(member, role).queue(
                success -> logger.info("SL role removed from {}", discordUserId),
                error -> logger.error("Failed to remove SL role from {}: {}", discordUserId, error.getMessage())), error -> logger.warn("Member not found for role removal: {}", discordUserId));
    }

    /**
     * Assign a specific Discord role to a user (for badge sync).
     */
    public void assignRole(String discordUserId, String roleId) {
        if (!isEnabled() || discordUserId == null || roleId == null || roleId.isBlank())
            return;
        Guild guild = jda.getGuildById(guildId);
        if (guild == null)
            return;
        Role role = guild.getRoleById(roleId);
        if (role == null) {
            logger.error("Role not found: {}", roleId);
            return;
        }
        guild.retrieveMemberById(discordUserId).queue(member -> guild.addRoleToMember(member, role).queue(
                success -> logger.info("Role {} assigned to {}", roleId, discordUserId),
                error -> logger.error("Failed to assign role {} to {}: {}", roleId, discordUserId,
                        error.getMessage())), error -> logger.warn("Member not found: {}", discordUserId));
    }

    /**
     * Remove a specific Discord role from a user (for badge sync).
     */
    public void removeRole(String discordUserId, String roleId) {
        if (!isEnabled() || discordUserId == null || roleId == null || roleId.isBlank())
            return;
        Guild guild = jda.getGuildById(guildId);
        if (guild == null)
            return;
        Role role = guild.getRoleById(roleId);
        if (role == null)
            return;
        guild.retrieveMemberById(discordUserId).queue(member -> guild.removeRoleFromMember(member, role).queue(
                success -> logger.info("Role {} removed from {}", roleId, discordUserId),
                error -> logger.error("Failed to remove role {} from {}: {}", roleId, discordUserId,
                        error.getMessage())), error -> logger.warn("Member not found: {}", discordUserId));
    }

    /**
     * Get list of guild members (for server membership check).
     */
    public int getGuildMemberCount() {
        if (!isEnabled())
            return 0;
        Guild guild = jda.getGuildById(guildId);
        return guild != null ? guild.getMemberCount() : 0;
    }

    /**
     * Download Discord avatar by discordUserId and upload to MinIO.
     * Returns the new MinIO URL, or null if failed.
     */
    public String syncDiscordAvatar(String discordUserId) {
        if (!isEnabled() || discordUserId == null || discordUserId.isBlank())
            return null;
        try {
            // Get avatar URL from Discord
            User discordUser = jda.retrieveUserById(discordUserId).complete();
            if (discordUser == null)
                return null;

            String avatarUrl = discordUser.getAvatarUrl();
            if (avatarUrl == null) {
                // Use default Discord avatar
                avatarUrl = discordUser.getDefaultAvatarUrl();
            }
            // Force PNG format, size 256
            if (avatarUrl.contains("?")) {
                avatarUrl = avatarUrl.split("\\?")[0] + "?size=256";
            } else {
                avatarUrl = avatarUrl + "?size=256";
            }

            if (!fileStorageService.isEnabled()) {
                logger.info("Minio disabled, returning original Discord avatar url for discordUserId={}",
                        discordUserId);
                return avatarUrl;
            }

            // Download avatar bytes
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(avatarUrl))
                    .GET()
                    .build();
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                logger.warn("Failed to download Discord avatar for {}: HTTP {}", discordUserId, response.statusCode());
                return avatarUrl; // Fallback to Discord CDN
            }

            String contentType = response.headers().firstValue("content-type").orElse("image/png");
            String extension = contentType.contains("gif") ? ".gif" : ".png";
            long contentLength = response.headers().firstValueAsLong("content-length").orElse(-1);

            String minioUrl = fileStorageService.uploadFromStream(
                    response.body(), contentLength, contentType, "avatars", extension);

            logger.info("Discord avatar synced to MinIO for discordUserId={}: {}", discordUserId, minioUrl);
            return minioUrl;
            // TODO auditLogService.logAction(0, "SYSTEM", "USER_CHANGE_AVATAR", "Админ
            // удалил пользователя", 1 /*targetUserId*/, "targetUsername");

        } catch (Exception e) {
            logger.error("Failed to sync Discord avatar for {}: {}", discordUserId, e.getMessage());
            return null;
        }
    }
}
