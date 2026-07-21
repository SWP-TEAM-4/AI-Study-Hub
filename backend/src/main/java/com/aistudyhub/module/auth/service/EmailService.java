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
        <body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <!-- Khung căn giữa màn hình -->
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;text-align:center;">
                  
                  <!-- Logo Text -->
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <h1 style="color:#cecece; font-size:28px; margin:0; letter-spacing: -1px; font-weight:800;">ai study hub</h1>
                    </td>
                  </tr>

                  <!-- Hero Image (Đã thay bằng ảnh localhost của bạn) -->
                  <tr>
                    <td align="center" style="padding-bottom:25px; padding-left:20px; padding-right:20px;">
                      <img src="http://localhost:5173/images/5d45a6737c5aadc9b85af3a585a72149.png" 
                           alt="AI Study Hub Banner" 
                           style="display:block; width:100%%; max-width:520px; height:auto; border-radius:16px;" />
                    </td>
                  </tr>

                  <!-- Lời chào & Nút CTA Chính -->
                  <tr>
                    <td align="center" style="padding: 0 40px;">
                      <h2 style="color:#4b4b4b; font-size:24px; font-weight:700; margin:0 0 15px;">Chào mừng, %s!</h2>
                      <p style="color:#777777; font-size:16px; line-height:1.6; margin:0 0 25px;">
                        Tài khoản của bạn đã được thiết lập thành công. Chào mừng bạn đến với AI Study Hub, nền tảng học tập thông minh nhất dành cho bạn!
                      </p>
                      <a href="http://localhost:3000" 
                         style="display:inline-block; padding:15px 40px; background:#1cb0f6; color:#ffffff; 
                                text-decoration:none; border-radius:14px; font-size:15px; font-weight:bold; 
                                text-transform:uppercase; border-bottom: 4px solid #1899d6;">
                         HỌC NGAY NÀO
                      </a>
                    </td>
                  </tr>

                  <!-- Đường kẻ phân cách -->
                  <tr>
                    <td align="center" style="padding: 40px 0;">
                      <hr style="border:none; border-top: 1px solid #e5e5e5; width: 100%%; margin:0;">
                    </td>
                  </tr>

                  <!-- Tính năng 1 -->
                  <tr>
                    <td align="left" style="padding: 0 20px;">
                      <table width="100%%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="100" align="center" valign="top">
                            <div style="font-size: 65px; line-height: 1;">🔥</div>
                          </td>
                          <td valign="top" style="padding-left: 20px;">
                            <h3 style="color:#4b4b4b; font-size:18px; margin:0 0 10px;">Bí kíp: Ôn tập hiệu quả</h3>
                            <p style="color:#777777; font-size:15px; line-height:1.5; margin:0 0 15px;">
                              Tạo thói quen vững chắc! Tự động tạo Quiz, Test & Flashcard từ tài liệu của bạn để giữ vững phong độ học tập mỗi ngày.
                            </p>
                            <a href="http://localhost:3000" style="color:#1cb0f6; font-weight:bold; text-decoration:none; font-size: 14px; text-transform:uppercase;">
                              LUYỆN TẬP NGAY
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Đường kẻ phân cách -->
                  <tr>
                    <td align="center" style="padding: 40px 0;">
                      <hr style="border:none; border-top: 1px solid #e5e5e5; width: 100%%; margin:0;">
                    </td>
                  </tr>

                  <!-- Tính năng 2 -->
                  <tr>
                    <td align="left" style="padding: 0 20px;">
                      <table width="100%%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td valign="top" style="padding-right: 20px; text-align:left;">
                            <h3 style="color:#4b4b4b; font-size:18px; margin:0 0 10px;">Lộ trình học cá nhân hóa</h3>
                            <p style="color:#777777; font-size:15px; line-height:1.5; margin:0;">
                              Sắp xếp Notebook khoa học và trò chuyện cùng Trợ lý AI theo từng bài giảng để tiết kiệm tối đa thời gian tìm kiếm kiến thức.
                            </p>
                          </td>
                          <td width="110" align="center" valign="top">
                            <div style="font-size: 70px; line-height: 1;">📱</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Nút CTA phụ trợ -->
                  <tr>
                    <td align="center" style="padding-top: 30px;">
                      <a href="http://localhost:3000" 
                         style="display:inline-block; padding:15px 40px; background:#1cb0f6; color:#ffffff; 
                                text-decoration:none; border-radius:14px; font-size:15px; font-weight:bold; 
                                text-transform:uppercase; border-bottom: 4px solid #1899d6;">
                         TÌM HIỂU THÊM
                      </a>
                    </td>
                  </tr>

                  <!-- Đường kẻ phân cách -->
                  <tr>
                    <td align="center" style="padding: 40px 0 30px;">
                      <hr style="border:none; border-top: 1px solid #e5e5e5; width: 100%%; margin:0;">
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 0 40px;">
                      <p style="color:#afafaf; font-size:12px; line-height:1.6; margin:0;">
                        © 2026 AI Study Hub – FPT University SWP391 Team 4<br>
                        Email này được gửi tự động, vui lòng không trả lời.
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
