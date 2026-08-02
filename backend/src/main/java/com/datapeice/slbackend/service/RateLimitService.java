package com.datapeice.slbackend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> emailBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    /**
     * Проверяет лимит отправки email для IP (3 в день)
     */
    public boolean checkEmailRateLimit(String ipAddress) {
        Bucket bucket = emailBuckets.computeIfAbsent(ipAddress, k -> createEmailBucket());
        return bucket.tryConsume(1);
    }

    /**
     * Проверяет лимит попыток аутентификации для IP (10 в минуту)
     */
    public boolean checkAuthRateLimit(String ipAddress) {
        Bucket bucket = authBuckets.computeIfAbsent(ipAddress, k -> createAuthBucket());
        return bucket.tryConsume(1);
    }

    private Bucket createEmailBucket() {
        // 3 письма в день
        Bandwidth limit = Bandwidth.classic(3, Refill.intervally(3, Duration.ofDays(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket createAuthBucket() {
        // 10 попыток в минуту
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Очистка старых записей (опционально, вызывать периодически)
     */
    public void cleanupOldEntries() {
        // Можно добавить логику очистки старых buckets
        // Для простоты оставляем как есть, так как ConcurrentHashMap не будет бесконечно расти
    }
}
