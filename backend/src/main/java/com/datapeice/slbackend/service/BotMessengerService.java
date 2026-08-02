package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.BotMessageRequest;
import com.datapeice.slbackend.dto.BotMessageResponse;
import com.datapeice.slbackend.dto.ConversationResponse;
import com.datapeice.slbackend.entity.BotMessage;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.BotMessageRepository;
import com.datapeice.slbackend.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BotMessengerService {

    private final BotMessageRepository botMessageRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public BotMessengerService(BotMessageRepository botMessageRepository,
                               UserRepository userRepository,
                               DiscordService discordService,
                               UserService userService,
                               SimpMessagingTemplate messagingTemplate) {
        this.botMessageRepository = botMessageRepository;
        this.userRepository = userRepository;
        this.discordService = discordService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversations() {
        List<User> allUsers = userRepository.findAll();
        List<BotMessage> latestMessages = botMessageRepository.findLatestMessagePerRecipient();

        Map<Long, BotMessage> latestMessageMap = new HashMap<>();
        for (BotMessage msg : latestMessages) {
            latestMessageMap.put(msg.getRecipientUser().getId(), msg);
        }

        List<ConversationResponse.ConversationItem> activeList = new ArrayList<>();
        List<ConversationResponse.ConversationItem> uncontactedList = new ArrayList<>();

        for (User u : allUsers) {
            ConversationResponse.ConversationItem item = new ConversationResponse.ConversationItem();
            item.setUser(userService.getUserProfile(u));

            if (latestMessageMap.containsKey(u.getId())) {
                BotMessage latest = latestMessageMap.get(u.getId());
                String snippet = latest.getContent();
                if ((snippet == null || snippet.isBlank()) && latest.getMediaUrl() != null) {
                    snippet = "📷 [Медиа]";
                }
                item.setLastMessage(snippet);
                item.setLastMessageTime(latest.getCreatedAt());
                item.setLastMessageIsEdited(latest.isEdited());
                activeList.add(item);
            } else {
                uncontactedList.add(item);
            }
        }

        // Sort active conversations by latest message time descending
        activeList.sort((a, b) -> {
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        // Sort uncontacted players alphabetically by username
        uncontactedList.sort((a, b) -> {
            String uA = a.getUser().getUsername() != null ? a.getUser().getUsername() : "";
            String uB = b.getUser().getUsername() != null ? b.getUser().getUsername() : "";
            return uA.compareToIgnoreCase(uB);
        });

        ConversationResponse response = new ConversationResponse();
        response.setActiveConversations(activeList);
        response.setUncontactedPlayers(uncontactedList);
        return response;
    }

    @Transactional
    public List<BotMessageResponse> getMessageHistory(Long recipientUserId) {
        botMessageRepository.markPlayerMessagesAsRead(recipientUserId);
        messagingTemplate.convertAndSend("/topic/admin/messenger", Map.of("readRecipientUserId", recipientUserId));
        return botMessageRepository.findByRecipientUserIdOrderByCreatedAtAsc(recipientUserId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BotMessageResponse sendMessage(Long adminId, BotMessageRequest request) {
        User recipient = userRepository.findById(request.getRecipientUserId())
                .orElseThrow(() -> new IllegalArgumentException("Получатель не найден"));
        User admin = userRepository.findById(adminId).orElse(null);

        BotMessage message = new BotMessage();
        message.setRecipientUser(recipient);
        message.setSenderAdmin(admin);
        message.setContent(request.getContent() != null ? request.getContent() : "");
        message.setMediaUrl(request.getMediaUrl());
        message.setCreatedAt(LocalDateTime.now());

        BotMessage saved = botMessageRepository.save(message);

        // Resolve Discord User ID if missing
        if (recipient.getDiscordUserId() == null && recipient.getDiscordNickname() != null) {
            discordService.findDiscordUserId(recipient.getDiscordNickname())
                    .ifPresent(id -> {
                        recipient.setDiscordUserId(id);
                        userRepository.save(recipient);
                    });
        }

        if (recipient.getDiscordUserId() != null) {
            discordService.sendDirectMessageAndGetId(
                    recipient.getDiscordUserId(),
                    saved.getContent(),
                    saved.getMediaUrl(),
                    discordMsgId -> {
                        saved.setDiscordMessageId(discordMsgId);
                        botMessageRepository.save(saved);
                    }
            );
        }

        BotMessageResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/admin/messenger", response);
        return response;
    }

    @Transactional
    public void processIncomingPlayerMessage(String discordUserId, String authorName, String content, String mediaUrl, String discordMessageId) {
        User playerUser = userRepository.findByDiscordUserId(discordUserId).orElse(null);
        if (playerUser == null && authorName != null) {
            playerUser = userRepository.findAll().stream()
                    .filter(u -> authorName.equalsIgnoreCase(u.getDiscordNickname()) || authorName.equalsIgnoreCase(u.getUsername()))
                    .findFirst()
                    .orElse(null);
        }
        if (playerUser == null) {
            return; // User not associated with any registered site user
        }

        if (playerUser.getDiscordUserId() == null) {
            playerUser.setDiscordUserId(discordUserId);
            userRepository.save(playerUser);
        }

        BotMessage message = new BotMessage();
        message.setRecipientUser(playerUser);
        message.setSenderAdmin(null);
        message.setContent(content != null ? content : "");
        message.setMediaUrl(mediaUrl);
        message.setDiscordMessageId(discordMessageId);
        message.setFromPlayer(true);
        message.setCreatedAt(LocalDateTime.now());

        BotMessage saved = botMessageRepository.save(message);
        BotMessageResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/admin/messenger", response);
    }

    @Transactional
    public BotMessageResponse editMessage(Long messageId, String newContent, String newMediaUrl) {
        BotMessage message = botMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Сообщение не найдено"));

        message.setContent(newContent != null ? newContent : "");
        message.setMediaUrl(newMediaUrl);
        message.setEdited(true);
        message.setUpdatedAt(LocalDateTime.now());

        BotMessage updated = botMessageRepository.save(message);

        User recipient = updated.getRecipientUser();
        if (recipient != null && recipient.getDiscordUserId() != null && updated.getDiscordMessageId() != null) {
            discordService.editDirectMessage(
                    recipient.getDiscordUserId(),
                    updated.getDiscordMessageId(),
                    updated.getContent(),
                    updated.getMediaUrl()
            );
        }

        BotMessageResponse response = mapToResponse(updated);
        messagingTemplate.convertAndSend("/topic/admin/messenger", response);
        return response;
    }

    @Transactional
    public void deleteMessage(Long messageId) {
        BotMessage message = botMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Сообщение не найдено"));

        User recipient = message.getRecipientUser();
        if (recipient != null && recipient.getDiscordUserId() != null && message.getDiscordMessageId() != null) {
            discordService.deleteDirectMessage(recipient.getDiscordUserId(), message.getDiscordMessageId());
        }

        botMessageRepository.delete(message);
        Map<String, Object> deletePayload = Map.of("deletedMessageId", messageId, "recipientUserId", recipient != null ? recipient.getId() : 0);
        messagingTemplate.convertAndSend("/topic/admin/messenger", deletePayload);
    }

    @Transactional
    public BotMessageResponse toggleReaction(Long messageId, String emoji) {
        BotMessage message = botMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Сообщение не найдено"));

        String current = message.getReactions();
        List<String> list = (current != null && !current.isBlank())
                ? new ArrayList<>(Arrays.asList(current.split(",")))
                : new ArrayList<>();

        if (list.contains(emoji)) {
            list.remove(emoji);
        } else {
            list.add(emoji);
        }

        String updated = String.join(",", list);
        message.setReactions(updated.isBlank() ? null : updated);
        BotMessage saved = botMessageRepository.save(message);

        User recipient = saved.getRecipientUser();
        if (recipient != null && recipient.getDiscordUserId() != null && saved.getDiscordMessageId() != null) {
            discordService.addReactionToDirectMessage(recipient.getDiscordUserId(), saved.getDiscordMessageId(), emoji);
        }

        BotMessageResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/admin/messenger", response);
        return response;
    }

    private BotMessageResponse mapToResponse(BotMessage msg) {
        BotMessageResponse dto = new BotMessageResponse();
        dto.setId(msg.getId());
        dto.setRecipientUserId(msg.getRecipientUser().getId());
        dto.setRecipientUsername(msg.getRecipientUser().getUsername());
        dto.setSenderAdminName(msg.isFromPlayer() ? msg.getRecipientUser().getUsername() : (msg.getSenderAdmin() != null ? msg.getSenderAdmin().getUsername() : "Бот"));
        dto.setContent(msg.getContent());
        dto.setMediaUrl(msg.getMediaUrl());
        dto.setEdited(msg.isEdited());
        dto.setFromPlayer(msg.isFromPlayer());
        dto.setRead(msg.isRead());
        dto.setReactions(msg.getReactions());
        dto.setCreatedAt(msg.getCreatedAt());
        dto.setUpdatedAt(msg.getUpdatedAt());
        return dto;
    }
}
