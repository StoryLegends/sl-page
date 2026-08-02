package com.datapeice.slbackend.service;

import io.minio.*;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.File;
import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final MinioClient minioClient;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final String minioEndpoint;
    private final String minioPublicUrl;
    private final int presignedUrlExpiryHours;
    private final boolean isAwsS3;

    public FileStorageService(
            @Autowired(required = false) MinioClient minioClient,
            @Autowired(required = false) S3Presigner s3Presigner,
            @Value("${minio.bucket-name}") String bucketName,
            @Value("${minio.endpoint}") String minioEndpoint,
            @Value("${minio.public-url:}") String minioPublicUrl,
            @Value("${minio.presigned-url-expiry-hours:168}") int presignedUrlExpiryHours) {
        this.minioClient = minioClient;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        this.minioEndpoint = minioEndpoint;
        this.minioPublicUrl = (minioPublicUrl != null && !minioPublicUrl.isBlank()) ? minioPublicUrl : null;
        this.presignedUrlExpiryHours = presignedUrlExpiryHours;
        this.isAwsS3 = minioEndpoint != null && minioEndpoint.contains("amazonaws.com");
        logger.info(
                "FileStorageService initialized: endpoint={}, bucket={}, publicUrl={}, presignedExpiry={}h, isAwsS3={}",
                minioEndpoint, bucketName, this.minioPublicUrl, presignedUrlExpiryHours, this.isAwsS3);
    }

    public boolean isEnabled() {
        return minioClient != null || s3Presigner != null;
    }

    /**
     * Builds a public URL for a stored object.
     * If minio.public-url is set, uses it as base (virtual-hosted-style for AWS
     * S3).
     * Otherwise falls back to path-style: endpoint/bucket/object.
     */
    private String buildPublicUrl(String filename) {
        if (minioPublicUrl != null) {
            return minioPublicUrl.stripTrailing() + "/" + filename;
        }
        return minioEndpoint + "/" + bucketName + "/" + filename;
    }

    /**
     * Загружает файл в MinIO и возвращает object key (presigned URL генерируется
     * отдельно)
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (minioClient == null) {
            logger.info("MinIO disabled, saving uploaded file to local disk uploads directory.");
            try {
                if (file.isEmpty()) {
                    throw new IllegalArgumentException("Файл пустой");
                }
                File uploadDir = new File("uploads/" + folder);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String filename = folder + "/" + UUID.randomUUID() + extension;
                File dest = new File("uploads/" + filename);
                file.transferTo(dest);
                return "/uploads/" + filename;
            } catch (Exception e) {
                logger.error("Error saving file to local disk: {}", e.getMessage(), e);
                return folder + "/disabled-" + UUID.randomUUID();
            }
        }
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Файл пустой");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Можно загружать только изображения");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Размер файла не должен превышать 5MB");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = folder + "/" + UUID.randomUUID() + extension;

            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(filename)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(contentType)
                                .build());
            }

            logger.info("Uploaded file to S3/MinIO: bucket={}, key={}", bucketName, filename);
            return filename;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Ошибка при загрузке файла в S3/MinIO: endpoint={}, bucket={}, error={}", minioEndpoint,
                    bucketName, e.getMessage(), e);
            throw new RuntimeException("Ошибка при загрузке файла: " + e.getMessage(), e);
        }
    }

    public String resolveUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        if (objectKey.startsWith("http://") || objectKey.startsWith("https://") || objectKey.startsWith("/uploads/") || objectKey.startsWith("uploads/")) {
            return objectKey;
        }
        if (minioClient == null) {
            return objectKey;
        }
        if (minioPublicUrl != null) {
            return buildPublicUrl(objectKey);
        }

        if (isAwsS3) {
            try {
                GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .build();

                GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofHours(presignedUrlExpiryHours))
                        .getObjectRequest(getObjectRequest)
                        .build();

                PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
                String url = presignedRequest.url().toString();
                logger.debug("Generated AWS presigned URL for {}: {}", objectKey, url);
                return url;
            } catch (Exception e) {
                logger.error("Ошибка при создании AWS presigned URL для {}: {}", objectKey, e.getMessage(), e);
                throw new RuntimeException("Ошибка при создании presigned URL: " + e.getMessage(), e);
            }
        }

        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(presignedUrlExpiryHours, TimeUnit.HOURS)
                            .build());
            logger.debug("Generated MinIO presigned URL for {}: {}", objectKey, url);
            return url;
        } catch (Exception e) {
            logger.error("Ошибка при создании presigned URL для {}: {}", objectKey, e.getMessage(), e);
            throw new RuntimeException("Ошибка при создании presigned URL: " + e.getMessage(), e);
        }
    }

    public String uploadFromStream(InputStream inputStream, long size, String contentType, String folder,
            String extension) {
        if (minioClient == null) {
            try {
                File uploadDir = new File("uploads/" + folder);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }
                String filename = folder + "/" + UUID.randomUUID() + extension;
                File dest = new File("uploads/" + filename);
                java.nio.file.Files.copy(inputStream, dest.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                return "/uploads/" + filename;
            } catch (Exception e) {
                logger.error("Error saving stream to local disk: {}", e.getMessage(), e);
                return folder + "/disabled-" + UUID.randomUUID() + extension;
            }
        }
        try {
            String filename = folder + "/" + UUID.randomUUID() + extension;
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filename)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build());
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при загрузке файла из потока: " + e.getMessage(), e);
        }
    }

    /**
     * Удаляет файл из MinIO
     */
    public void deleteFile(String fileUrl) {
        if (minioClient == null) {
            return;
        }
        try {
            String objectName = extractObjectNameFromUrl(fileUrl);
            if (objectName != null) {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .build());
            }
        } catch (Exception e) {
            System.err.println("Ошибка при удалении файла: " + e.getMessage());
        }
    }

    /**
     * Получает временную подписанную ссылку на файл
     */
    public String getPresignedUrl(String objectName, int expiryMinutes) {
        return resolveUrl(objectName);
    }

    /**
     * Public method to extract object key from a URL (for re-resolving old URLs).
     */
    public String extractObjectKey(String fileUrl) {
        return extractObjectNameFromUrl(fileUrl);
    }

    /**
     * Извлекает имя объекта из полного URL или возвращает значение как есть, если
     * это уже ключ объекта.
     */
    private String extractObjectNameFromUrl(String fileUrl) {
        if (fileUrl == null)
            return null;
        if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
            return fileUrl;
        }
        String urlWithoutQuery = fileUrl.contains("?") ? fileUrl.substring(0, fileUrl.indexOf("?")) : fileUrl;
        // Try virtual-hosted-style first (publicUrl/key)
        if (minioPublicUrl != null && urlWithoutQuery.startsWith(minioPublicUrl)) {
            String base = minioPublicUrl.endsWith("/") ? minioPublicUrl : minioPublicUrl + "/";
            return urlWithoutQuery.substring(base.length());
        }
        // Fall back to path-style (endpoint/bucket/key)
        if (urlWithoutQuery.contains(bucketName)) {
            int bucketIndex = urlWithoutQuery.indexOf(bucketName);
            return urlWithoutQuery.substring(bucketIndex + bucketName.length() + 1);
        }
        return null;
    }
}
