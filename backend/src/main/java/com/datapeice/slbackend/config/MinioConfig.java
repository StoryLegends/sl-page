package com.datapeice.slbackend.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "minio.enabled", havingValue = "true", matchIfMissing = true)
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    // Optional: needed for AWS S3 / Bucketeer (ignored for local MinIO)
    @Value("${minio.region:}")
    private String region;

    @Bean
    public MinioClient minioClient() {
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey);

        if (region != null && !region.isBlank()) {
            builder.region(region);
        }

        MinioClient minioClient = builder.build();

        // Try to check/create bucket, but don't fail startup if not possible
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build());

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build());
                System.out.println("Created bucket: " + bucketName);
            } else {
                System.out.println("Bucket already exists: " + bucketName);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not verify/create bucket (may already exist): " + e.getMessage());
        }

        // Try to apply public-read policy (will fail on Bucketeer due to
        // BlockPublicPolicy — that's OK)
        try {
            String policy = """
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {"AWS": "*"},
                                "Action": ["s3:GetObject"],
                                "Resource": ["arn:aws:s3:::%s/*"]
                            }
                        ]
                    }
                    """.formatted(bucketName);

            minioClient.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(bucketName)
                            .config(policy)
                            .build());
            System.out.println("Applied public-read bucket policy.");
        } catch (Exception e) {
            System.err.println(
                    "Warning: Could not set bucket policy (will use presigned URLs instead): " + e.getMessage());
        }

        return minioClient;
    }

    /**
     * AWS SDK v2 S3Presigner for generating proper presigned URLs.
     * Used when MINIO_ENDPOINT points to AWS S3.
     */
    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        S3Presigner.Builder builder = S3Presigner.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials));

        // Set region
        if (region != null && !region.isBlank()) {
            builder.region(Region.of(region));
        } else {
            builder.region(Region.US_EAST_1);
        }

        // If endpoint is not default AWS, set it (for local MinIO)
        if (endpoint != null && !endpoint.contains("amazonaws.com")) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }

    @Bean
    public String minioBucketName() {
        return bucketName;
    }

    @Bean
    public String minioEndpoint() {
        return endpoint;
    }
}
