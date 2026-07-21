package com.aistudyhub.module.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Owner: BE1 – Email service cho Auth module.
 *
 * Load template HTML từ classpath để email đóng gói được trong jar.
 * Email thất bại chỉ log lỗi, KHÔNG throw ra ngoài (tránh block auth flow).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private static final String RESET_PASSWORD_TEMPLATE = "/templates/email/reset-password.html";
  private static final String WELCOME_TEMPLATE = "/templates/email/welcome.html";
  private static final String DEFAULT_PUBLIC_BASE_URL = "https://aistudyhub.com";

  private final JavaMailSender mailSender;

  @Value("${app.mail.from:noreply@aistudyhub.com}")
  private String fromAddress;

  @Value("${app.mail.from-name:AI Study Hub}")
  private String fromName;

  @Value("${app.mail.reset-password-url:http://localhost:5173/reset-password}")
  private String resetPasswordBaseUrl;

  @Value("${app.mail.dashboard-url:http://localhost:5173/dashboard}")
  private String dashboardUrl;

  @Value("${app.mail.onboarding-url:http://localhost:5173/onboarding}")
  private String onboardingUrl;

  @Value("${app.mail.token-expire-minutes:30}")
  private int tokenExpireMinutes;

  @Async
  public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
    sendPasswordResetEmail(toEmail, fullName, token, tokenExpireMinutes);
  }

  @Async
  public void sendPasswordResetEmail(String toEmail, String fullName, String token, int expireMinutes) {
    String displayName = displayName(fullName, toEmail);
    String resetLink = resetPasswordBaseUrl + "?token=" + token;

    sendHtmlEmail(
            toEmail,
            "Đặt lại mật khẩu – AI Study Hub",
            buildResetPasswordHtml(displayName, resetLink, expireMinutes),
            "password reset");
  }

  @Async
  public void sendRegistrationVerificationEmail(String toEmail, String fullName, String verificationCode,
                                                int expireMinutes) {
    String displayName = displayName(fullName, toEmail);
    sendHtmlEmail(
            toEmail,
            "Mã xác thực tài khoản – AI Study Hub",
            buildRegistrationVerificationHtml(displayName, verificationCode, expireMinutes),
            "registration verification");
  }

  @Async
  public void sendWelcomeEmail(String toEmail, String fullName) {
    sendHtmlEmail(
            toEmail,
            "Chào mừng đến với AI Study Hub!",
            buildWelcomeHtml(displayName(fullName, toEmail)),
            "welcome");
  }

  private void sendHtmlEmail(String toEmail, String subject, String html, String purpose) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

      helper.setFrom(fromAddress, fromName);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(html, true);

      mailSender.send(message);
      log.info("[EmailService] {} email sent to: {}", purpose, toEmail);
    } catch (MessagingException e) {
      log.error("[EmailService] Failed to send {} email to {}: {}", purpose, toEmail, e.getMessage());
    } catch (Exception e) {
      log.error("[EmailService] Unexpected error sending {} email to {}: {}", purpose, toEmail, e.getMessage());
    }
  }

  private String buildResetPasswordHtml(String displayName, String resetLink, int expireMinutes) {
    String safeName = escape(displayName);
    String safeResetLink = escape(resetLink);
    String expireLabel = expireMinutes + " minutes";

    return loadTemplate(RESET_PASSWORD_TEMPLATE)
            .replace("[Your Name]", safeName)
            .replace("https://aistudyhub.com/reset-password?token=ABC123", safeResetLink)
            .replace("Link expires in 30 minutes", "Link expires in " + expireLabel)
            .replace("expires in 30 minutes", "expires in " + expireLabel)
            .replace(">30</text>", ">" + expireMinutes + "</text>")
            .replace(DEFAULT_PUBLIC_BASE_URL + "/security", publicUrl("/security"));
  }

  private String buildWelcomeHtml(String displayName) {
    return loadTemplate(WELCOME_TEMPLATE)
            .replace("[Your Name]", escape(displayName))
            .replace(DEFAULT_PUBLIC_BASE_URL + "/dashboard", escape(dashboardUrl))
            .replace(DEFAULT_PUBLIC_BASE_URL + "/onboarding", escape(onboardingUrl))
            .replace(DEFAULT_PUBLIC_BASE_URL + "/unsubscribe", publicUrl("/unsubscribe"))
            .replace(DEFAULT_PUBLIC_BASE_URL + "/privacy", publicUrl("/privacy"));
  }

  private String buildRegistrationVerificationHtml(String displayName, String verificationCode, int expireMinutes) {
    String html = buildWelcomeHtml(displayName)
            .replace("your study companion just got a lot cuter — let's set up your path in 60 seconds. ✨",
                    "your verification code is " + escape(verificationCode) + ". It expires in "
                            + expireMinutes + " minutes.")
            .replace("Your account is all set up.", "Your account is almost ready.")
            .replace("Complete your profile and unlock a", "Enter the verification code below to activate your")
            .replace("personalised study path", "AI Study Hub account")
            .replace("tailored just for you.", "before it expires.")
            .replace("Profile progress", "Activation code")
            .replace("80% <span style=\"color:#5C6678;font-weight:600;font-family:'Quicksand',sans-serif;font-size:12px;\">done</span>",
                    expireMinutes + " min <span style=\"color:#5C6678;font-weight:600;font-family:'Quicksand',sans-serif;font-size:12px;\">left</span>")
            .replace("Let's go", "Open AI Study Hub")
            .replace("Day 1 starts now — let's build that streak!",
                    "Use this one-time code to activate your account safely.");

    return html.replace(
            "          <!-- ============ CTA BUTTON (aurora glow) ============ -->",
            buildVerificationCodeBlock(verificationCode, expireMinutes)
                    + "\n          <!-- ============ CTA BUTTON (aurora glow) ============ -->");
  }

  private String buildVerificationCodeBlock(String verificationCode, int expireMinutes) {
    return """
          <!-- ============ VERIFICATION CODE ============ -->
          <tr>
            <td class="mobile-pad" align="center" style="padding:6px 48px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:linear-gradient(135deg,#F0FDF4 0%,#EEF4FE 100%);border:1px solid rgba(22,164,122,0.22);border-radius:16px;box-shadow:0 8px 24px rgba(22,164,122,0.12);">
                <tr>
                  <td align="center" style="padding:24px 24px 22px;">
                    <p style="margin:0 0 10px;font-family:'Quicksand',sans-serif;font-size:11px;color:#16A47A;font-weight:700;text-transform:uppercase;letter-spacing:2.2px;">
                      Verification code
                    </p>
                    <div style="display:inline-block;background:#FFFFFF;border:1px dashed rgba(22,164,122,0.35);border-radius:14px;padding:16px 24px;font-family:'JetBrains Mono','Courier New',monospace;font-size:30px;font-weight:800;letter-spacing:8px;color:#1A2333;box-shadow:0 8px 20px rgba(22,164,122,0.14);">
                      {{CODE}}
                    </div>
                    <p style="margin:14px 0 0;font-family:'Quicksand',sans-serif;font-size:13px;color:#5C6678;line-height:1.6;">
                      This code expires in <strong style="color:#16A47A;">{{EXPIRE_MINUTES}} minutes</strong>.
                      Never share it with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        """.replace("{{CODE}}", escape(verificationCode))
            .replace("{{EXPIRE_MINUTES}}", String.valueOf(expireMinutes));
  }

  private String loadTemplate(String classpathLocation) {
    try (InputStream inputStream = getClass().getResourceAsStream(classpathLocation)) {
      if (inputStream == null) {
        throw new IllegalStateException("Email template not found: " + classpathLocation);
      }
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IllegalStateException("Cannot read email template: " + classpathLocation, e);
    }
  }

  private String displayName(String fullName, String fallbackEmail) {
    return StringUtils.hasText(fullName) ? fullName.trim() : fallbackEmail;
  }

  private String publicUrl(String path) {
    return escape(DEFAULT_PUBLIC_BASE_URL + path);
  }

  private String escape(String value) {
    return HtmlUtils.htmlEscape(value == null ? "" : value, StandardCharsets.UTF_8.name());
  }
}
