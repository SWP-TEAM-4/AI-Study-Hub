package com.aistudyhub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.Properties;

/**
 * Owner: BE1 – Email configuration.
 * <p>
 * Dùng SSL trực tiếp trên port 465 (thay vì STARTTLS port 587).
 * Phù hợp với mail server cPanel/Plesk như mail.zill.vn.
 */

@Configuration
@EnableAsync
public class MailConfig {

    @Value("${spring.mail.host:mail.tino.vn}")
    private String host;

    @Value("${spring.mail.port:465}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        mailSender.setDefaultEncoding("UTF-8");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");

        // STARTTLS trên port 587 (phù hợp với Tino Group / cPanel chuẩn)
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.smtp.ssl.checkserveridentity", "false");

        // Force LOGIN/PLAIN auth (bỏ XOAUTH2/NTLM)
        props.put("mail.smtp.auth.mechanisms", "LOGIN PLAIN");
        props.put("mail.smtp.auth.login.disable", "false");
        props.put("mail.smtp.auth.plain.disable", "false");
        props.put("mail.smtp.auth.ntlm.disable", "true");
        props.put("mail.smtp.auth.xoauth2.disable", "true");
        props.put("mail.smtp.sasl.enable", "false");

        // Debug – ghi ra System.out (terminal), tắt sau khi xác nhận OK
        props.put("mail.debug", "true");
        props.put("mail.debug.auth", "true");

        // Timeout (ms)
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        mailSender.setSession(
                jakarta.mail.Session.getInstance(props, new jakarta.mail.Authenticator() {
                    @Override
                    protected jakarta.mail.PasswordAuthentication getPasswordAuthentication() {
                        return new jakarta.mail.PasswordAuthentication(username, password);
                    }
                }));

        return mailSender;
    }
}

