import nodemailer from "nodemailer";
import { generateEmailHtml, EmailTemplateData, EMAIL_NOTIFICATION_CATALOG } from "./emailTemplates";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Check if any email delivery channel is active (GAS proxy or SMTP)
   */
  public isConfigured(): boolean {
    return Boolean(process.env.GAS_EMAIL_URL || (process.env.SMTP_USER && process.env.SMTP_PASS));
  }

  /**
   * Get active delivery channel name
   */
  public getDeliveryMethod(): "GOOGLE_APPS_SCRIPT" | "SMTP" | "NONE" {
    if (process.env.GAS_EMAIL_URL) return "GOOGLE_APPS_SCRIPT";
    if (process.env.SMTP_USER && process.env.SMTP_PASS) return "SMTP";
    return "NONE";
  }

  /**
   * Send email using Google Apps Script Web App HTTP Proxy.
   * Designed specifically for cloud hosts like Render.com that block outbound SMTP (ports 25, 465, 587).
   */
  private async sendViaGoogleAppsScript(
    to: string,
    subject: string,
    message: string,
    htmlContent: string,
    options?: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const gasUrl = process.env.GAS_EMAIL_URL?.trim();
    if (!gasUrl) {
      return { success: false, error: "GAS_EMAIL_URL is not configured" };
    }

    const payload = {
      apiKey: process.env.GAS_API_KEY || undefined,
      to,
      subject,
      text: message,
      html: htmlContent,
      fromName: options?.fromName || "SOFRA Platform",
      replyTo: options?.replyTo || process.env.SMTP_USER || undefined,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Using text/plain;charset=utf-8 prevents CORS preflight issues in GAS while transmitting raw JSON
      const response = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GAS proxy returned HTTP ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Invalid JSON returned from GAS proxy: ${responseText.slice(0, 120)}`);
      }

      if (data.success) {
        return {
          success: true,
          messageId: data.messageId || `gas_${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || "Failed to deliver email via Google Apps Script proxy",
        };
      }
    } catch (error: any) {
      const isTimeout = error.name === "AbortError";
      const errorMsg = isTimeout ? "GAS proxy request timed out (15 seconds)" : error.message;
      return { success: false, error: errorMsg };
    }
  }

  public async sendEmail(to: string, subject: string, message: string, options?: any) {
    // Determine template type
    const templateType = options?.notificationType || options?.type || "GENERAL";

    // Gather template data
    const templateData: EmailTemplateData = {
      message,
      restaurantName: options?.restaurantName,
      recipientName: options?.recipientName,
      order: options?.order,
      resetUrl: options?.resetUrl,
      reason: options?.reason || message,
      documentType: options?.documentType,
      planName: options?.planName,
      daysRemaining: options?.daysRemaining,
      expiryDate: options?.expiryDate,
      changedAt: options?.changedAt,
    };

    const htmlContent = generateEmailHtml(templateType, templateData);

    // 1. Prioritize Google Apps Script HTTP Proxy (ideal for Render & serverless environments)
    if (process.env.GAS_EMAIL_URL) {
      console.log(`[EmailService] Attempting delivery via GAS HTTP Proxy to: ${to} (Template: ${templateType})...`);
      const gasResult = await this.sendViaGoogleAppsScript(to, subject, message, htmlContent, options);

      if (gasResult.success) {
        console.log(`[EmailService] Email (${templateType}) sent successfully via GAS Proxy to ${to} (ID: ${gasResult.messageId})`);
        return {
          success: true,
          method: "GOOGLE_APPS_SCRIPT",
          messageId: gasResult.messageId,
          html: htmlContent,
        };
      }

      console.warn(`[EmailService] GAS proxy failed (${gasResult.error}). Checking SMTP fallback...`);
    }

    // 2. Nodemailer SMTP (standard local / unblocked server)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      if (!this.transporter) {
        this.initTransporter();
      }

      const mailOptions = {
        from: `"SOFRA Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      };

      try {
        const info = await this.transporter!.sendMail(mailOptions);
        console.log(`[EmailService] Email (${templateType}) sent successfully via SMTP to ${to} (ID: ${info.messageId})`);
        return {
          success: true,
          method: "SMTP",
          messageId: info.messageId,
          html: htmlContent,
        };
      } catch (error: any) {
        console.error(`[EmailService] Error sending email via SMTP to ${to}:`, error);
        return {
          success: false,
          method: "SMTP",
          error: error.message,
          html: htmlContent,
        };
      }
    }

    console.log(`[EmailService] No email transport configured (GAS_EMAIL_URL or SMTP credentials missing). Skipped delivery to: ${to} (Template: ${templateType})`);
    return {
      success: false,
      reason: "NOT_CONFIGURED",
      html: htmlContent,
    };
  }

  async sendRegistrationOtpEmail(email: string, otp: string, restaurantName: string) {
    return await this.sendEmail(
      email,
      `🔐 Your Sofra Verification Code: ${otp}`,
      `Your 6-digit SOFRA account verification code is: ${otp}. Valid for 10 minutes.`,
      { type: "REGISTRATION_OTP", otp, restaurantName }
    );
  }

  async sendPasswordResetEmail(email: string, tokenUrl: string) {
    await this.sendEmail(
      email,
      "🔐 Reset Your Sofra Account Password",
      "We received a request to reset the password for your SOFRA account.",
      { type: "PASSWORD_RESET", resetUrl: tokenUrl }
    );
  }

  async sendPasswordChangedEmail(email: string) {
    await this.sendEmail(
      email,
      "✅ Security Alert: Sofra Account Password Changed",
      "The password for your SOFRA account has been successfully changed.",
      { type: "PASSWORD_CHANGED", changedAt: new Date().toUTCString() }
    );
  }

  /**
   * Get preview HTML for any catalog template
   */
  public getPreviewHtml(templateType: string, customData?: EmailTemplateData): string {
    return generateEmailHtml(templateType, customData || {});
  }

  /**
   * Get available catalog metadata
   */
  public getCatalog() {
    return EMAIL_NOTIFICATION_CATALOG;
  }
}

export default new EmailService();
