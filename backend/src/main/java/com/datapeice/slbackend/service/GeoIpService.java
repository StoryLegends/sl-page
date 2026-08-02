package com.datapeice.slbackend.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeoIpService {

    private static final Logger logger = LoggerFactory.getLogger(GeoIpService.class);
    private static final String API_URL = "http://ip-api.com/json/%s?fields=status,countryCode,city";

    // Cache: IP -> formatted result (never expires, IPs don't change geo often)
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    /**
     * Returns formatted location string: "CC,City,IP"
     * e.g. "RU,Moscow,78.10.162.140"
     * Priority: CF-Connecting-IP > X-Forwarded-For > remote addr (handled in controller)
     */
    public String formatIpWithGeo(String ip) {
        if (ip == null || ip.isBlank() || isLocalIp(ip)) {
            return ip;
        }
        return cache.computeIfAbsent(ip, this::lookupGeo);
    }

    private String lookupGeo(String ip) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(String.format(API_URL, ip)))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
                String status = json.has("status") ? json.get("status").getAsString() : "";
                if ("success".equals(status)) {
                    String countryCode = json.has("countryCode") ? json.get("countryCode").getAsString() : "?";
                    String city = json.has("city") ? json.get("city").getAsString() : "?";
                    return countryCode + "," + city + "," + ip;
                }
            }
        } catch (Exception e) {
            logger.warn("GeoIP lookup failed for {}: {}", ip, e.getMessage());
        }
        return ip;
    }

    private boolean isLocalIp(String ip) {
        return ip.equals("127.0.0.1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.equals("::1")
                || ip.startsWith("192.168.")
                || ip.startsWith("10.")
                || ip.startsWith("172.16.")
                || ip.startsWith("172.17.")
                || ip.startsWith("172.18.")
                || ip.startsWith("172.19.")
                || ip.startsWith("172.2")
                || ip.startsWith("172.30.")
                || ip.startsWith("172.31.");
    }
}
