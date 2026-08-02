package com.datapeice.slbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@org.springframework.scheduling.annotation.EnableScheduling
public class SlbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SlbackendApplication.class, args);
    }

}
