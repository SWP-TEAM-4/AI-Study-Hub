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

/**
 * Owner: BE1 – Email service cho Auth module (forgot password, welcome mail).
 * <p>
 * Sử dụng MailSMTP qua JavaMailSender (cấu hình tại
 * {@code config/MailConfig.java}).
 * Tất cả method đều {@code @Async} để không block request thread.
 * Email thất bại chỉ log lỗi, KHÔNG throw ra ngoài (tránh lộ email existence).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${app.mail.from:noreply@aistudyhub.com}")
  private String fromAddress;

  @Value("${app.mail.from-name:AI Study Hub}")
  private String fromName;

  @Value("${app.mail.reset-password-url:http://localhost:5173/reset-password}")
  private String resetPasswordBaseUrl;

  @Value("${app.mail.token-expire-minutes:30}")
  private int tokenExpireMinutes;

  // ── Forgot Password Email ─────────────────────────────────────────────────

  /**
   * Gửi email reset password với HTML template đẹp.
   * Được gọi bất đồng bộ từ {@link AuthService#forgotPassword}.
   *
   * @param toEmail  địa chỉ email người nhận
   * @param fullName tên hiển thị (có thể null, fallback về email)
   * @param token    reset token UUID
   */
  @Async
  public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
    sendPasswordResetEmail(toEmail, fullName, token, tokenExpireMinutes);
  }

  @Async
  public void sendPasswordResetEmail(String toEmail, String fullName, String token, int expireMinutes) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : toEmail;
    String resetLink = resetPasswordBaseUrl + "?token=" + token;

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromAddress, fromName);
      helper.setTo(toEmail);
      helper.setSubject("Đặt lại mật khẩu – AI Study Hub");
      helper.setText(buildResetPasswordHtml(displayName, resetLink, expireMinutes), true);

      mailSender.send(message);
      log.info("[EmailService] Password reset email sent to: {}", toEmail);

    } catch (MessagingException e) {
      log.error("[EmailService] Failed to send password reset email to {}: {}", toEmail, e.getMessage());
    } catch (Exception e) {
      log.error("[EmailService] Unexpected error sending email to {}: {}", toEmail, e.getMessage());
    }
  }

  // ── Welcome Email ─────────────────────────────────────────────────────────

  /**
   * Gửi email chào mừng sau khi đăng ký thành công.
   *
   * @param toEmail  địa chỉ email người nhận
   * @param fullName tên hiển thị
   */
  @Async
  public void sendWelcomeEmail(String toEmail, String fullName) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromAddress, fromName);
      helper.setTo(toEmail);
      helper.setSubject("Chào mừng đến với AI Study Hub!");
      helper.setText(buildWelcomeHtml(fullName), true);

      mailSender.send(message);
      log.info("[EmailService] Welcome email sent to: {}", toEmail);

    } catch (MessagingException e) {
      log.error("[EmailService] Failed to send welcome email to {}: {}", toEmail, e.getMessage());
    } catch (Exception e) {
      log.error("[EmailService] Unexpected error sending welcome email to {}: {}", toEmail, e.getMessage());
    }
  }

  // ── HTML Templates ────────────────────────────────────────────────────────

  private String buildResetPasswordHtml(String displayName, String resetLink, int expireMinutes) {
    return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Đặt lại mật khẩu – AI Study Hub</title>
        </head>
        <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0"
                       style="background:#1a1a2e;border-radius:16px;overflow:hidden;
                              box-shadow:0 8px 32px rgba(99,102,241,0.25);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1 0%%,#8b5cf6 50%%,#06b6d4 100%%);
                                padding:36px 40px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;
                                  letter-spacing:-0.5px;">AI Study Hub</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                        Nền tảng học tập thông minh
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 12px;color:#e2e8f0;font-size:20px;font-weight:600;">
                        Xin chào, %s!
                      </h2>
                      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        Chúng tôi nhận được yêu cầu <strong style="color:#e2e8f0;">đặt lại mật khẩu</strong>
                        cho tài khoản của bạn. Nhấn nút bên dưới để tiếp tục.
                      </p>

                      <!-- CTA Button -->
                      <table width="100%%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:8px 0 28px;">
                            <a href="%s"
                               style="display:inline-block;padding:14px 36px;
                                      background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                      color:#fff;text-decoration:none;border-radius:10px;
                                      font-size:15px;font-weight:600;
                                      box-shadow:0 4px 16px rgba(99,102,241,0.4);
                                      letter-spacing:0.3px;">
                               Đặt lại mật khẩu
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Warning box -->
                      <div style="background:#1e1e3f;border:1px solid #312e81;border-radius:10px;
                                   padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;color:#a5b4fc;font-size:13px;line-height:1.6;">
                           <strong>Link có hiệu lực trong %d phút.</strong><br/>
                          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                          Tài khoản của bạn vẫn an toàn.
                        </p>
                      </div>

                      <!-- Fallback link -->
                      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
                        Nút không hoạt động? Copy link dưới đây vào trình duyệt:<br/>
                        <span style="color:#818cf8;word-break:break-all;">%s</span>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#111827;padding:20px 40px;text-align:center;
                                border-top:1px solid #1f2937;">
                      <p style="margin:0;color:#4b5563;font-size:12px;">
                        © 2026 AI Study Hub – FPT University SWP391 Team 4<br/>
                        Email này được gửi tự động, vui lòng không reply.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(displayName, resetLink, expireMinutes, resetLink);
  }

  private String buildWelcomeHtml(String fullName) {
    return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Chào mừng – AI Study Hub</title>
        </head>
        <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0"
                       style="background:#1a1a2e;border-radius:16px;overflow:hidden;
                              box-shadow:0 8px 32px rgba(99,102,241,0.25);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1 0%%,#8b5cf6 50%%,#06b6d4 100%%);
                                padding:36px 40px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">AI Study Hub</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                        Nền tảng học tập thông minh
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:20px;font-weight:600;">
                        Chào mừng, %s!
                      </h2>
                      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
                        Tài khoản của bạn đã được tạo thành công trên <strong style="color:#a5b4fc;">AI Study Hub</strong>.<br/>
                        Bắt đầu hành trình học tập thông minh ngay hôm nay!
                      </p>

                      <!-- Feature highlights -->
                      <div style="background:#111827;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                        <p style="margin:0 0 12px;color:#6366f1;font-size:13px;font-weight:600;
                                   text-transform:uppercase;letter-spacing:1px;">Tính năng nổi bật</p>
                        <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">Chat AI theo từng tài liệu học tập</p>
                        <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">Tạo Quiz, Test & Flashcard tự động</p>
                        <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">Quản lý Notebook & Document thông minh</p>
                        <p style="margin:0;color:#cbd5e1;font-size:14px;">Chia sẻ nội dung trên Marketplace</p>
                      </div>

                      <table width="100%%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="http://localhost:3000"
                               style="display:inline-block;padding:14px 36px;
                                      background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                      color:#fff;text-decoration:none;border-radius:10px;
                                      font-size:15px;font-weight:600;
                                      box-shadow:0 4px 16px rgba(99,102,241,0.4);">
                               Bắt đầu học ngay
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#111827;padding:20px 40px;text-align:center;
                                border-top:1px solid #1f2937;">
                      <p style="margin:0;color:#4b5563;font-size:12px;">
                        © 2026 AI Study Hub – FPT University SWP391 Team 4<br/>
                        Email này được gửi tự động, vui lòng không reply.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        .formatted(fullName);
  }
}
