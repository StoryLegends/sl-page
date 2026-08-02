package com.datapeice.slbackend.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DiscordOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(DiscordOAuthService.class);

    private static final String DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
    private static final String DISCORD_USER_URL = "https://discord.com/api/users/@me";
    private static final String DISCORD_AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize";

    @Value("${discord.oauth.client-id:}")
    private String clientId;

    @Value("${discord.oauth.client-secret:}")
    private String clientSecret;

    @Value("${discord.oauth.redirect-uri:}")
    private String redirectUri;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Build the Discord OAuth2 authorization URL with identify scope.
     * The state parameter is used to pass the user's JWT for callback identification.
     */
    public String buildAuthorizationUrl(String state) {
        return DISCORD_AUTHORIZE_URL +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=identify" +
                "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);
    }

    /**
     * Exchange OAuth2 authorization code for an access token.
     * Returns the access token string or null on failure.
     */
    public String exchangeCodeForToken(String code) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            logger.error("Discord OAuth client ID or secret not configured");
            return null;
        }

        Map<String, String> params = Map.of(
                "client_id", clientId,
                "client_secret", clientSecret,
                "grant_type", "authorization_code",
                "code", code,
                "redirect_uri", redirectUri
        );

        String body = params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" +
                          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(DISCORD_TOKEN_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("Discord token exchange failed. Status: {}, Body: {}", response.statusCode(), response.body());
                return null;
            }

            JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
            if (json.has("access_token")) {
                return json.get("access_token").getAsString();
            }
            logger.error("Discord token response missing access_token: {}", response.body());
            return null;

        } catch (Exception e) {
            logger.error("Exception exchanging Discord OAuth code: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Fetch Discord user info using an access token.
     * Returns a DiscordUserInfo record or null on failure.
     */
    public DiscordUserInfo fetchUserInfo(String accessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(DISCORD_USER_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("Discord user info fetch failed. Status: {}, Body: {}", response.statusCode(), response.body());
                return null;
            }

            JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
            String id = json.get("id").getAsString();
            String username = json.get("username").getAsString();
            String globalName = json.has("global_name") && !json.get("global_name").isJsonNull()
                    ? json.get("global_name").getAsString()
                    : null;
            // discriminator is "0" for new-style usernames
            String discriminator = json.has("discriminator") ? json.get("discriminator").getAsString() : "0";

            return new DiscordUserInfo(id, username, globalName, discriminator);

        } catch (Exception e) {
            logger.error("Exception fetching Discord user info: {}", e.getMessage());
            return null;
        }
    }

    public record DiscordUserInfo(String id, String username, String globalName, String discriminator) {
        /**
         * Returns the display name: global_name if set, otherwise username.
         */
        public String displayName() {
            return (globalName != null && !globalName.isBlank()) ? globalName : username;
        }
    }
}

