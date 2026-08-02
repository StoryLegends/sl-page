package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

@Data
public class CreateApplicationRequest {
    @NotBlank(message = "Имя не может быть пустым")
    @Size(max = 50)
    private String firstName;

    @NotNull(message = "Возраст не может быть пустым")
    @Min(value = 0, message = "Возраст не может быть меньше 0")
    @Max(value = 126, message = "Возраст не может быть больше 126")
    private Integer age;

    @NotBlank(message = "Расскажите, почему хотите играть у нас")
    @Size(max = 2000)
    private String whyUs;

    @NotBlank(message = "Укажите, откуда узнали о сервере")
    @Size(max = 1000)
    private String source;

    private boolean makeContent;

    @Size(min = 200, max = 2000, message = "Дополнительная информация должна содержать минимум 200 символов")
    private String additionalInfo;

    @NotNull(message = "Укажите самооценку от 1 до 10")
    private Integer selfRating;

    @NotBlank(message = "reCAPTCHA token is required")
    private String recaptchaToken;
}
