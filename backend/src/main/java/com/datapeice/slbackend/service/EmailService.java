package com.datapeice.slbackend.service;

import com.mailgun.api.v3.MailgunMessagesApi;
import com.mailgun.client.MailgunClient;
import com.mailgun.model.message.Message;
import com.mailgun.model.message.MessageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${mailgun.api-key}")
    private String apiKey;

    @Value("${mailgun.domain}")
    private String domain;

    @Value("${mailgun.from-email}")
    private String fromEmail;

    @Value("${mailgun.from-name}")
    private String fromName;

    @Value("${mailgun.base-url:https://api.mailgun.net}")
    private String baseUrl;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    // Вспомогательный метод для обертки каждого письма в "космический" стиль сайта
    private String wrapHtml(String content) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #050505;">
                    <tr>
                        <td align="center" style="padding: 40px 10px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.9);">
                                <tr>
                                    <td align="center" style="padding: 50px 20px 30px 20px; background: radial-gradient(circle, #1a1a1a 0%%, #0d0d0d 100%%);">
                                        <img src="https://www.storylegends.xyz/images/logo.png" alt="StoryLegends" width="300" style="display: block; width: 100%%; max-width: 320px; height: auto; outline: none; border: none;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 40px 40px 40px; text-align: center;">
                                        %s
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px; background-color: #080808; border-top: 1px solid #1a1a1a; text-align: center;">
                                        <p style="margin: 0; color: #555; font-size: 12px; letter-spacing: 1px;">
                                            © 2026 STORYLEGENDS.XYZ<br>
                                            <span style="color: #333;">БЕСПЛАТНЫЙ ПРИВАТНЫЙ MINECRAFT СЕРВЕР</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, content);
    }

    public void sendVerificationEmail(String toEmail, String username, String token) {
        if (!emailEnabled) return;
        String url = frontendUrl + "/verify-email?token=" + token;

        String content = String.format("""
            <h1 style="color: #f4a127; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Подтверждение</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Привет, <b style="color: #4a9fd8;">%s</b>!<br>
                Твоя история на сервере вот-вот начнется. Подтверди свой адрес, чтобы активировать аккаунт:
            </p>
            <a href="%s" style="display: inline-block; padding: 18px 45px; background: linear-gradient(90deg, #f4a127 0%%, #4a9fd8 100%%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 20px rgba(244, 161, 39, 0.4); text-transform: uppercase;">
                Начать приключение
            </a>
            <p style="margin-top: 30px; font-size: 12px; color: #444;">Или используй ссылку: <br> %s</p>
            """, username, url, url);

        sendEmail(toEmail, "Подтверждение email - StoryLegends", wrapHtml(content));
    }

    public void sendForgotPasswordEmail(String toEmail, String username, String token) {
        if (!emailEnabled) return;
        String url = frontendUrl + "/reset-password?token=" + token;

        String content = String.format("""
            <h1 style="color: #f4a127; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Доступ</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Привет, <b>%s</b>! Забыл пароль? <br>
                Нажми на кнопку ниже, чтобы создать новый и вернуться в игру.
            </p>
            <a href="%s" style="display: inline-block; padding: 18px 45px; background: linear-gradient(90deg, #f4a127 0%%, #4a9fd8 100%%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 20px rgba(244, 161, 39, 0.4); text-transform: uppercase;">
                Сбросить пароль
            </a>
            """, username, url);

        sendEmail(toEmail, "Восстановление пароля - StoryLegends", wrapHtml(content));
    }

    public void sendPasswordResetEmail(String toEmail, String username, String newPassword) {
        if (!emailEnabled) return;

        String content = String.format("""
            <h1 style="color: #f4a127; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Пароль изменен</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Привет, <b style="color: #4a9fd8;">%s</b>!<br>
                Администрация сбросила твой пароль.
            </p>
            <div style="background: #1a1a1a; border: 1px dashed #4a9fd8; padding: 25px; border-radius: 12px; margin: 20px 0;">
                <span style="color: #888; font-size: 12px; display: block; margin-bottom: 10px; letter-spacing: 2px;">ВРЕМЕННЫЙ ПАРОЛЬ</span>
                <span style="color: #f4a127; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px;">%s</span>
            </div>
            <p style="color: #4a9fd8; font-size: 14px;">Пожалуйста, смени его сразу после входа!</p>
            """, username, newPassword);

        sendEmail(toEmail, "Новый пароль - StoryLegends", wrapHtml(content));
    }

    public void sendApplicationAcceptedEmail(String toEmail, String username, String discordNickname) {
        if (!emailEnabled) return;

        String content = String.format("""
            <h1 style="color: #4CAF50; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Заявка принята!</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Поздравляем, <b>%s</b>! Твоя заявка на сервер StoryLegends одобрена.
            </p>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Теперь ты полноправный игрок. Заходи в наш Discord, если тебя там еще нет, и начинай игру!
            </p>
            <p style="color: #888; font-size: 14px;">Discord: %s</p>
            <a href="%s" style="display: inline-block; padding: 18px 45px; background: linear-gradient(90deg, #4CAF50 0%%, #8BC34A 100%%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4); text-transform: uppercase;">
                Перейти на сайт
            </a>
            """, username, discordNickname, frontendUrl);

        sendEmail(toEmail, "Заявка принята - StoryLegends", wrapHtml(content));
    }

    public void sendApplicationRejectedEmail(String toEmail, String username, String reason) {
        if (!emailEnabled) return;

        String content = String.format("""
            <h1 style="color: #F44336; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Заявка отклонена</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Привет, <b>%s</b>. К сожалению, твоя заявка на сервер была отклонена администрацией.
            </p>
            <div style="background: #1a1a1a; border: 1px dashed #F44336; padding: 25px; border-radius: 12px; margin: 20px 0;">
                <span style="color: #888; font-size: 12px; display: block; margin-bottom: 10px; letter-spacing: 2px;">ПРИЧИНА</span>
                <p style="color: #e0e0e0; margin: 0;">%s</p>
            </div>
            <p style="color: #888; font-size: 14px;">Ты можешь подать новую заявку позже, исправив замечания.</p>
            """, username, reason != null ? reason : "Причина не указана");

        sendEmail(toEmail, "Обновление статуса заявки - StoryLegends", wrapHtml(content));
    }

    public void sendBanEmail(String toEmail, String username, String reason) {
        if (!emailEnabled) return;

        String content = String.format("""
            <h1 style="color: #F44336; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">🚫 Аккаунт заблокирован</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Привет, <b style="color: #4a9fd8;">%s</b>.<br>
                Ваш аккаунт на StoryLegends был <b style="color: #F44336;">заблокирован</b> администрацией.
            </p>
            <div style="background: #1a1a1a; border: 1px dashed #F44336; padding: 25px; border-radius: 12px; margin: 20px 0;">
                <span style="color: #888; font-size: 12px; display: block; margin-bottom: 10px; letter-spacing: 2px;">ПРИЧИНА БЛОКИРОВКИ</span>
                <p style="color: #e0e0e0; margin: 0;">%s</p>
            </div>
            <p style="color: #888; font-size: 14px;">Если вы считаете, что блокировка была ошибочной, свяжитесь с администрацией через Discord.</p>
            """, username, reason != null ? reason : "Причина не указана");

        sendEmail(toEmail, "Аккаунт заблокирован - StoryLegends", wrapHtml(content));
    }

    public void sendWarningEmail(String toEmail, String username, String reason) {
        if (!emailEnabled) return;

        String content = String.format("""
            <h1 style="color: #FF9800; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">⚠️ Предупреждение</h1>
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Привет, <b>%s</b>. Ты получил предупреждение от администрации сервера StoryLegends.
            </p>
            <div style="background: #1a1a1a; border: 1px dashed #FF9800; padding: 25px; border-radius: 12px; margin: 20px 0;">
                <span style="color: #888; font-size: 12px; display: block; margin-bottom: 10px; letter-spacing: 2px;">ПРИЧИНА</span>
                <p style="color: #e0e0e0; margin: 0;">%s</p>
            </div>
            <p style="color: #888; font-size: 14px;">Пожалуйста, ознакомься с правилами сервера, чтобы избежать дальнейших предупреждений.</p>
            """, username, reason != null ? reason : "Причина не указана");

        sendEmail(toEmail, "Предупреждение - StoryLegends", wrapHtml(content));
    }

    private void sendEmail(String toEmail, String subject, String htmlBody) {
        try {
            MailgunMessagesApi mailgunMessagesApi = MailgunClient.config(baseUrl, apiKey)
                    .createApi(MailgunMessagesApi.class);

            Message message = Message.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(toEmail)
                    .subject(subject)
                    .html(htmlBody)
                    .build();

            MessageResponse response = mailgunMessagesApi.sendMessage(domain, message);
            logger.info("Email sent successfully to {}: {}", toEmail, response.getMessage());
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}