package com.datapeice.slbackend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@Service
public class ModerationService {
    private static final Logger logger = LoggerFactory.getLogger(ModerationService.class);

    @Value("classpath:banned_words.txt")
    private Resource bannedWordsResource;

    @Value("${sightengine.api.user:}")
    private String sightengineApiUser;

    @Value("${sightengine.api.secret:}")
    private String sightengineApiSecret;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private final Set<String> bannedWords = new HashSet<>();
    private final List<Pattern> bannedPatterns = new ArrayList<>();

    @PostConstruct
    public void initBadWords() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(bannedWordsResource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim().toLowerCase();
                if (!line.isEmpty() && !line.startsWith("#")) {
                    String[] words = line.split(",");
                    for (String word : words) {
                        word = word.trim();
                        if (!word.isEmpty()) {
                            // Очищаем от любых разделителей типа точек (х.о.х.о.л -> хохол) для точного
                            // списка,
                            // если хотим, но так как ниже есть умный паттерн, можно оставить как есть
                            bannedWords.add(word);
                            // Создаем умный паттерн только для слов длиной от 4 символов,
                            // чтобы избежать ложных срабатываний на союзах и предлогах.
                            if (word.length() >= 4) {
                                bannedPatterns.add(createBannedPattern(word));
                            }
                        }
                    }
                }
            }
            logger.info("Successfully loaded {} banned words and compiled smart patterns.", bannedWords.size());
        } catch (Exception e) {
            logger.error("Could not load banned_words.txt from resources! Loading default fallback list. Error: {}",
                    e.getMessage());
            for (String word : Arrays.asList("негр", "пидарас", "пидор", "ебан", "уеб", "хуй", "шлюха", "бляд", "spam",
                    "scam")) {
                bannedWords.add(word);
                bannedPatterns.add(createBannedPattern(word));
            }
        }
    }

    private Pattern createBannedPattern(String word) {
        String cleaned = word.replaceAll("[^a-zа-яё]", "");
        if (cleaned.isEmpty()) {
            return Pattern.compile("a^"); // Impossible match
        }
        StringBuilder regex = new StringBuilder();
        for (char c : cleaned.toCharArray()) {
            regex.append(Pattern.quote(String.valueOf(c))).append("+");
        }
        return Pattern.compile(regex.toString());
    }

    private String normalizeAndApplyHomoglyphs(String text) {
        String s = text.toLowerCase();
        // Replace common symbol substitutes
        s = s.replace("@", "а").replace("0", "о").replace("3", "з")
                .replace("4", "ч").replace("6", "б").replace("$", "с")
                .replace("!", "и").replace("1", "и");

        // Keep only letters
        s = s.replaceAll("[^a-zа-яё]", "");

        // Map Latin lookalikes to Cyrillic
        s = s.replace("a", "а").replace("o", "о").replace("e", "е")
                .replace("c", "с").replace("p", "р").replace("x", "х")
                .replace("y", "у").replace("k", "к").replace("m", "м")
                .replace("h", "н").replace("t", "т").replace("b", "в")
                .replace("u", "и");

        return s;
    }

    private String normalizeOnlyLetters(String text) {
        return text.toLowerCase().replaceAll("[^a-zа-яё]", "");
    }

    // Регулярка для поиска подозрительных паттернов (ссылки, попытки скрыть мат
    // символами)
    private static final Pattern SUSPICIOUS_PATTERN = Pattern.compile(
            "(http|https)://|www\\.|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
            Pattern.CASE_INSENSITIVE);

    /**
     * Локальная проверка текста.
     * Работает мгновенно и бесплатно.
     */
    public boolean isTextToxic(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }

        String lowerText = text.toLowerCase();
        String lettersOnly = normalizeOnlyLetters(text);
        String homoglyphs = normalizeAndApplyHomoglyphs(text);

        // 1. Простая проверка на вхождение оригинальных слов
        for (String banned : bannedWords) {
            // Игнорируем слишком короткие слова (1-2 символа) во избежание ложных
            // срабатываний
            if (banned.length() <= 2)
                continue;

            if (banned.length() <= 5) {
                // Короткие слова (3-5 символов) - проверяем только как отдельные слова
                // Используем regex для проверки границ слов
                String regex = "\\b" + Pattern.quote(banned) + "\\b";
                if (Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS)
                        .matcher(lowerText).find()) {
                    logger.warn("Content flagged: contains short banned word '{}' as standalone", banned);
                    return true;
                }
            } else {
                // Длинные слова (>= 6) - проверяем как подстроку
                if (lowerText.contains(banned)) {
                    logger.warn("Content flagged: contains banned word '{}'", banned);
                    return true;
                }
            }
        }

        // 2. Продвинутая проверка (игнорирует точки, пробелы, цифры, дубликаты букв,
        // п0дмену я3ыков)
        for (Pattern pattern : bannedPatterns) {
            if (pattern.matcher(lettersOnly).find() || pattern.matcher(homoglyphs).find()) {
                logger.warn("Content flagged by smart pattern: {}", pattern.pattern());
                return true;
            }
        }

        // 2. Проверка на подозрительные ссылки (если в профиле их нельзя)
        if (SUSPICIOUS_PATTERN.matcher(lowerText).find()) {
            logger.warn("Content flagged: contains suspicious link or email");
            return true;
        }

        return false;
    }

    /**
     * Проверка изображения через Sightengine API (Nudity 2.1)
     */
    public boolean isImageInappropriate(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return false;
        }

        if (sightengineApiUser == null || sightengineApiUser.isBlank() ||
                sightengineApiSecret == null || sightengineApiSecret.isBlank()) {
            logger.warn("Sightengine credentials are not configured. Skipping image moderation.");
            return false;
        }

        try {
            String encodedUrl = URLEncoder.encode(imageUrl, StandardCharsets.UTF_8);
            String urlString = "https://api.sightengine.com/1.0/check.json?models=nudity-2.1&api_user="
                    + sightengineApiUser + "&api_secret=" + sightengineApiSecret + "&url=" + encodedUrl;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlString))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonObject jsonResponse = JsonParser.parseString(response.body()).getAsJsonObject();
                if (jsonResponse.has("status") && "success".equals(jsonResponse.get("status").getAsString())) {
                    JsonObject nudity = jsonResponse.getAsJsonObject("nudity");
                    if (nudity != null) {
                        double noneProbability = nudity.get("none").getAsDouble();
                        // Если вероятность того, что контент 'безопасный' (none) ниже 50%, считаем
                        // неуместным.
                        if (noneProbability < 0.5) {
                            logger.warn("Image flagged by Sightengine. Nudity prediction: {}", nudity);
                            return true;
                        }
                    }
                } else {
                    logger.error("Sightengine API returned an error: {}", response.body());
                }
            } else {
                logger.error("Failed to check image with Sightengine. Status: {}, Response: {}",
                        response.statusCode(), response.body());
            }
        } catch (Exception e) {
            logger.error("Exception during Sightengine image moderation: {}", e.getMessage());
        }

        return false;
    }
}