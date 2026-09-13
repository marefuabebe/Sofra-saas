/**
 * SOFRA Modern Email Notification Template Engine
 * Generates responsive, high-aesthetic transactional emails compatible with
 * Apple Mail, Gmail, Outlook, Yahoo, and mobile email clients.
 */

export interface EmailTemplateData {
  recipientName?: string;
  restaurantName?: string;
  order?: {
    _id?: string;
    orderNumber?: string | number;
    customerName?: string;
    customerPhone?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    total?: number;
    totalAmount?: number;
    paymentMethod?: string;
    tableNumber?: string | number;
    notes?: string;
    createdAt?: Date | string;
  };
  resetUrl?: string;
  actionUrl?: string;
  reason?: string;
  documentType?: string;
  planName?: string;
  daysRemaining?: number;
  expiryDate?: string;
  changedAt?: string;
  ipAddress?: string;
  message?: string;
}

export interface EmailTemplateMeta {
  type: string;
  category: "ORDERS" | "SECURITY" | "VERIFICATION" | "BILLING" | "MANAGEMENT";
  title: string;
  subject: string;
  description: string;
  previewText: string;
}

export const EMAIL_NOTIFICATION_CATALOG: EmailTemplateMeta[] = [
  {
    type: "NEW_ORDER",
    category: "ORDERS",
    title: "New Order Received",
    subject: "⚡ New Order #{orderId} Received — Sofra Kitchen",
    description: "Real-time kitchen order notification with line items, total in ETB, and direct KDS access.",
    previewText: "You have a new incoming order waiting for kitchen prep.",
  },
  {
    type: "PASSWORD_RESET",
    category: "SECURITY",
    title: "Password Reset Request",
    subject: "🔐 Reset Your Sofra Account Password",
    description: "Time-sensitive password reset security link with 60-minute expiration countdown.",
    previewText: "A password reset request was initiated for your Sofra account.",
  },
  {
    type: "PASSWORD_CHANGED",
    category: "SECURITY",
    title: "Password Changed Confirmation",
    subject: "✅ Security Alert: Sofra Account Password Changed",
    description: "Immediate confirmation sent when account password is updated with emergency contact link.",
    previewText: "Your Sofra account password was successfully updated.",
  },
  {
    type: "VERIFICATION_SUBMITTED",
    category: "VERIFICATION",
    title: "Verification Under Review",
    subject: "📄 Verification Documents Received — Under Review",
    description: "Confirmation that trade license and TIN dossier were received by the compliance team.",
    previewText: "Your KYC documents have been submitted and are under review.",
  },
  {
    type: "VERIFICATION_APPROVED",
    category: "VERIFICATION",
    title: "Account Verified & Approved",
    subject: "🎉 Congratulations! Your Restaurant is Approved on Sofra",
    description: "Celebratory activation notice confirming the digital menu and storefront are live.",
    previewText: "Your restaurant verification is approved! Start receiving diner orders.",
  },
  {
    type: "DOCUMENT_REJECTED",
    category: "VERIFICATION",
    title: "Document Rejected",
    subject: "⚠️ Document Review Required — Sofra Verification",
    description: "Correction request for a specific invalid or blurry document with reviewer notes.",
    previewText: "One of your submitted documents requires correction.",
  },
  {
    type: "VERIFICATION_CHANGES_REQUESTED",
    category: "VERIFICATION",
    title: "Verification Changes Requested",
    subject: "📝 Action Required: Update Your Verification Info",
    description: "Detailed compliance review notes requesting additional documents or information.",
    previewText: "Please provide a few more details to finalize your verification.",
  },
  {
    type: "VERIFICATION_REJECTED",
    category: "VERIFICATION",
    title: "Verification Rejected",
    subject: "❌ Sofra Partner Verification Status Update",
    description: "Formal notification if a restaurant application does not meet compliance standards.",
    previewText: "Update regarding your Sofra restaurant partner application.",
  },
  {
    type: "SUBSCRIPTION_EXPIRING_7_DAYS",
    category: "BILLING",
    title: "Subscription Expiring Soon",
    subject: "⏳ Reminder: Your Sofra Plan Renews in 7 Days",
    description: "Proactive billing reminder preventing interruption to digital menu QR codes and KDS.",
    previewText: "Keep your restaurant operating smoothly by reviewing your subscription.",
  },
  {
    type: "RESTAURANT_STATUS_CHANGED",
    category: "MANAGEMENT",
    title: "Account Status Update",
    subject: "🔔 Account Status Update — Sofra Platform",
    description: "Notification for administrative suspension or reactivation with support links.",
    previewText: "An update has been made to your restaurant's operating status.",
  },
];

/**
 * Common Email Shell with ultra-modern dark-to-light card architecture,
 * subtle glows, high-contrast typography, and official verified footer.
 */
function wrapInEmailShell(contentHtml: string, previewText: string = "Sofra Restaurant Platform Notification"): string {
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Sofra Notification</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    .btn-glow:hover {
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%) !important;
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45) !important;
    }
    @media only screen and (max-width: 640px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
        border-radius: 0 !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 12px !important;
      }
      .mobile-center {
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 36px 12px; background-color: #0b0f19; background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0b0f19 75%);">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; color: #0b0f19; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <center style="width: 100%; background-color: transparent;">
    <!-- Main 600px Container -->
    <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);">
      
      <!-- Top Brand Ambient Bar -->
      <tr>
        <td style="background: linear-gradient(90deg, #f97316 0%, #fb923c 50%, #ea580c 100%); height: 4px; font-size: 1px; line-height: 1px;">
          &nbsp;
        </td>
      </tr>

      <!-- Master Dark Header -->
      <tr>
        <td style="background: linear-gradient(180deg, #090d16 0%, #0f172a 100%); padding: 26px 36px; border-bottom: 1px solid #1e293b;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 14px;">
                      <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); text-align: center; line-height: 44px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35); border: 1px solid rgba(255, 255, 255, 0.2);">
                        <span style="font-size: 22px; color: #ffffff;">🍽️</span>
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td>
                            <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;">SOFRA</span>
                            <span style="color: #f97316; font-size: 22px; font-weight: 900;">.</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: #94a3b8; display: block; margin-top: 1px;">Restaurant OS &bull; Ethiopia</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" align="right">
                <table cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 9999px; padding: 4px 12px;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 6px;">
                      <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; box-shadow: 0 0 6px #10b981;"></div>
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="color: #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">Verified Dispatch</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body Content Injection Area -->
      <tr>
        <td class="mobile-padding" style="padding: 38px 36px 32px 36px; background-color: #ffffff;">
          ${contentHtml}
        </td>
      </tr>

      <!-- Trust Strip Matrix -->
      <tr>
        <td style="padding: 0 36px 28px 36px; background-color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7; padding: 14px 18px;">
            <tr>
              <td class="mobile-stack" width="33%" align="center" style="font-size: 11px; color: #475569; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #f97316; font-size: 14px; vertical-align: middle;">⚡</span> Instant KDS Sync
              </td>
              <td class="mobile-stack" width="33%" align="center" style="font-size: 11px; color: #475569; font-weight: 700; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #10b981; font-size: 14px; vertical-align: middle;">🔒</span> 256-Bit TLS Security
              </td>
              <td class="mobile-stack" width="33%" align="center" style="font-size: 11px; color: #475569; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #6366f1; font-size: 14px; vertical-align: middle;">📱</span> Telebirr & QR Ready
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Sleek Dark Footer -->
      <tr>
        <td style="background-color: #090d16; padding: 32px 36px; color: #94a3b8; font-size: 12px; line-height: 1.6; border-top: 1px solid #1e293b;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" style="padding-bottom: 18px;">
                <span style="color: #f8fafc; font-weight: 800; font-size: 13px; letter-spacing: -0.2px;">SOFRA Food Technologies PLC</span>
                <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                  Next-generation restaurant operating system powering contactless QR ordering, real-time kitchen intelligence, and instant mobile settlement in Addis Ababa.
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #1e293b; padding-top: 18px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="mobile-stack" valign="middle" style="color: #64748b; font-size: 11px;">
                      &copy; ${currentYear} Sofra Technologies. All rights reserved.<br>
                      Addis Ababa, Ethiopia &bull; <a href="mailto:support@sofra.com" style="color: #f97316; text-decoration: none; font-weight: 700;">support@sofra.com</a>
                    </td>
                    <td class="mobile-stack mobile-center" valign="middle" align="right">
                      <a href="${frontendUrl}/dashboard" style="color: #cbd5e1; text-decoration: none; font-size: 11px; font-weight: 700; margin-left: 14px;">Dashboard</a>
                      <a href="${frontendUrl}/dashboard/orders" style="color: #cbd5e1; text-decoration: none; font-size: 11px; font-weight: 700; margin-left: 14px;">KDS Kitchen</a>
                      <a href="${frontendUrl}/dashboard/billing" style="color: #cbd5e1; text-decoration: none; font-size: 11px; font-weight: 700; margin-left: 14px;">Billing</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    <!-- Anti-Spam Security Tagline -->
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 16px auto 0 auto; max-width: 600px;">
      <tr>
        <td align="center" style="font-size: 11px; color: #64748b; line-height: 1.5;">
          This is an official transactional notification dispatched by Sofra Restaurant OS.<br>
          Delivered to authorized restaurant operator credentials.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Generate full modern HTML template for any notification type.
 */
export function generateEmailHtml(type: string, data: EmailTemplateData = {}): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  switch (type) {
    // ─────────────────────────────────────────────────────────────
    // 1. NEW ORDER RECEIVED (KITCHEN & RESTAURANT ALERT)
    // ─────────────────────────────────────────────────────────────
    case "NEW_ORDER":
    case "ORDER": {
      const order = data.order || {};
      const orderNumber = order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : "8942");
      const customerName = order.customerName || "Diner (Tableside QR)";
      const tableNumber = order.tableNumber ? `Table ${order.tableNumber}` : "Direct Takeaway";
      const totalAmount = (order.total || order.totalAmount || 0).toFixed(2);
      const paymentMethod = order.paymentMethod || "Telebirr (Mobile Money)";
      const notes = order.notes || "";
      const items = order.items && order.items.length > 0 ? order.items : [
        { name: "Special Kitfo Plate (Medium)", quantity: 2, price: 350 },
        { name: "Tibes Firfir with Boiled Egg", quantity: 1, price: 280 },
        { name: "Fresh Avocado Mango Juice", quantity: 2, price: 90 },
      ];
      const ordersDashboardUrl = `${frontendUrl}/dashboard/orders`;

      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 700;">
            <span style="display: inline-block; min-width: 26px; height: 24px; border-radius: 8px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); color: #ea580c; text-align: center; line-height: 24px; font-size: 12px; font-weight: 900; margin-right: 10px; border: 1px solid #fed7aa;">
              ${item.quantity}x
            </span>
            ${item.name}
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 800;">
            ETB ${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `).join("");

      const content = `
        <!-- Hero Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td width="58" valign="middle">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fdba74; text-align: center; line-height: 52px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);">
                <span style="font-size: 26px;">🛎️</span>
              </div>
            </td>
            <td valign="middle" style="padding-left: 14px;">
              <span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #fde68a;">
                Incoming Kitchen Ticket
              </span>
              <h1 style="margin: 6px 0 0 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                New Order #${orderNumber}
              </h1>
            </td>
          </tr>
        </table>

        <!-- Order Meta Highlight Box -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td class="mobile-stack" width="50%" style="padding: 18px 20px; border-right: 1px solid #e2e8f0;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; display: block;">Customer & Table</span>
              <span style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 3px; display: block;">${customerName}</span>
              <span style="font-size: 12px; color: #f97316; font-weight: 700; margin-top: 2px; display: block;">📍 ${tableNumber}</span>
            </td>
            <td class="mobile-stack" width="50%" style="padding: 18px 20px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; display: block;">Settlement Amount</span>
              <span style="font-size: 20px; font-weight: 900; color: #16a34a; margin-top: 3px; display: block;">ETB ${totalAmount}</span>
              <span style="font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px; display: block;">💳 ${paymentMethod}</span>
            </td>
          </tr>
        </table>

        <!-- Order Manifest -->
        <div style="margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 8px;">
                  Kitchen Prep Manifest (${items.length} Dishes)
                </span>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${itemsHtml}
          </table>
        </div>

        ${notes ? `
        <!-- Diner Notes -->
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0; padding: 14px 18px; margin-bottom: 24px;">
          <span style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">
            Diner Special Request / Prep Note
          </span>
          <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 600; font-style: italic;">
            "${notes}"
          </p>
        </div>
        ` : ""}

        <!-- Action Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; margin: 30px 0 16px 0;">
          <tr>
            <td align="center">
              <a href="${ordersDashboardUrl}" class="btn-glow" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 36px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35); letter-spacing: 0.3px; border: 1px solid rgba(255, 255, 255, 0.2);">
                Open in Kitchen Display (KDS) &rarr;
              </a>
            </td>
          </tr>
        </table>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
          Kitchen prep timer automatically tracks once marked as <em>Preparing</em>.
        </p>
      `;
      return wrapInEmailShell(content, `⚡ New Order #${orderNumber} for ETB ${totalAmount} from ${customerName}`);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. PASSWORD RESET REQUEST
    // ─────────────────────────────────────────────────────────────
    case "PASSWORD_RESET": {
      const resetUrl = data.resetUrl || `${frontendUrl}/reset-password?token=sample-token-abc`;

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fdba74; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.18);">
                <span style="font-size: 30px;">🔐</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #fecaca;">
                Time-Sensitive Security Link
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 440px;">
                We received a request to choose a new password for your SOFRA restaurant owner account.
              </p>
            </td>
          </tr>
        </table>

        <!-- Security Warning Box -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 14px; border: 1px solid #fef3c7; padding: 16px 20px; margin-bottom: 28px;">
          <tr>
            <td width="30" valign="top">
              <span style="font-size: 20px;">⏳</span>
            </td>
            <td valign="top" style="color: #92400e; font-size: 13px; line-height: 1.5; padding-left: 10px;">
              <strong>Strict Security Protocol:</strong> This single-use authorization token expires in exactly <strong>60 minutes</strong>. If you did not initiate this request, your account remains secure and you may discard this email.
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; margin-bottom: 28px;">
          <tr>
            <td align="center">
              <a href="${resetUrl}" class="btn-glow" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35); letter-spacing: 0.3px; border: 1px solid rgba(255, 255, 255, 0.2);">
                Choose New Password &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- URL Fallback -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <span style="color: #64748b; font-size: 11px; font-weight: 700; display: block; margin-bottom: 4px;">Direct Secure Link:</span>
          <a href="${resetUrl}" style="color: #f97316; font-size: 11px; word-break: break-all; text-decoration: none; font-family: monospace;">${resetUrl}</a>
        </div>
      `;
      return wrapInEmailShell(content, "Reset your Sofra account password. Link expires in 60 minutes.");
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PASSWORD CHANGED CONFIRMATION
    // ─────────────────────────────────────────────────────────────
    case "PASSWORD_CHANGED": {
      const changedAt = data.changedAt || new Date().toUTCString();

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.18);">
                <span style="font-size: 30px;">✅</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #bbf7d0;">
                Credentials Secured
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Password Successfully Updated
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 440px;">
                Your password for Sofra Restaurant Platform was changed on <strong>${changedAt}</strong>.
              </p>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td width="36" valign="top">
              <span style="font-size: 22px;">🛡️</span>
            </td>
            <td valign="top" style="color: #475569; font-size: 13px; line-height: 1.6; padding-left: 10px;">
              <strong>Active Sessions Terminated:</strong> All active sessions on other browsers or devices have been logged out automatically for maximum account security.
            </td>
          </tr>
        </table>

        <!-- Emergency Alert -->
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 16px 20px; margin-bottom: 28px;">
          <span style="color: #991b1b; font-size: 13px; font-weight: 800; display: block; margin-bottom: 4px;">
            Did not request this change?
          </span>
          <span style="color: #b91c1c; font-size: 12px; line-height: 1.5; display: block;">
            Contact our security emergency dispatch immediately at <a href="mailto:security@sofra.com" style="color: #991b1b; font-weight: 800; text-decoration: underline;">security@sofra.com</a> to freeze your restaurant storefront.
          </span>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/login" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Log In with New Credentials &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, "Your Sofra account password was updated successfully.");
    }

    // ─────────────────────────────────────────────────────────────
    // 4. VERIFICATION SUBMITTED (KYC UNDER REVIEW)
    // ─────────────────────────────────────────────────────────────
    case "VERIFICATION_SUBMITTED": {
      const restaurantName = data.restaurantName || "Your Restaurant";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.18);">
                <span style="font-size: 30px;">📋</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #bfdbfe;">
                Compliance In Progress
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Dossier Received for Audit
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 450px;">
                Thank you, <strong>${restaurantName}</strong>! Your trade license, TIN certificate, and identity dossier are logged in our compliance queue.
              </p>
            </td>
          </tr>
        </table>

        <!-- Step Progress Tracker -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 28px;">
          <tr>
            <td width="33%" align="center" style="vertical-align: top;">
              <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #10b981; color: #ffffff; text-align: center; line-height: 30px; font-weight: 900; font-size: 12px; margin: 0 auto 6px auto;">✓</div>
              <span style="font-size: 12px; font-weight: 800; color: #0f172a; display: block;">1. Submitted</span>
              <span style="font-size: 10px; color: #10b981; font-weight: 700;">Completed</span>
            </td>
            <td width="33%" align="center" style="vertical-align: top;">
              <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; text-align: center; line-height: 30px; font-weight: 900; font-size: 12px; margin: 0 auto 6px auto; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);">2</div>
              <span style="font-size: 12px; font-weight: 800; color: #1d4ed8; display: block;">2. Legal Audit</span>
              <span style="font-size: 10px; color: #3b82f6; font-weight: 700;">Under Review</span>
            </td>
            <td width="33%" align="center" style="vertical-align: top;">
              <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #e2e8f0; color: #94a3b8; text-align: center; line-height: 30px; font-weight: 900; font-size: 12px; margin: 0 auto 6px auto;">3</div>
              <span style="font-size: 12px; font-weight: 700; color: #64748b; display: block;">3. Storefront Live</span>
              <span style="font-size: 10px; color: #94a3b8;">Pending Approval</span>
            </td>
          </tr>
        </table>

        <!-- SLA SLA Note -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 14px; border: 1px solid #bbf7d0; padding: 14px 18px; margin-bottom: 24px;">
          <tr>
            <td width="28" valign="top">
              <span style="font-size: 18px;">⏱️</span>
            </td>
            <td valign="top" style="color: #166534; font-size: 13px; line-height: 1.5; padding-left: 8px;">
              <strong>Review SLA:</strong> Most commercial dossiers are validated within <strong>24 business hours</strong>. You will receive an immediate email once approved.
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard/verification" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Track Verification Status &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, `Verification documents for ${restaurantName} are under review.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. VERIFICATION APPROVED (CELEBRATORY ACTIVATION)
    // ─────────────────────────────────────────────────────────────
    case "VERIFICATION_APPROVED": {
      const restaurantName = data.restaurantName || "Your Restaurant";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 70px; height: 70px; border-radius: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #34d399; text-align: center; line-height: 70px; display: inline-block; box-shadow: 0 10px 24px rgba(16, 185, 129, 0.25);">
                <span style="font-size: 34px;">🎉</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                Verified Partner Status Granted
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                You're Officially Live on Sofra!
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 460px;">
                Congratulations <strong>${restaurantName}</strong>! Your legal compliance audit passed. Your digital restaurant storefront and tableside QR ordering are unlocked and ready for diners.
              </p>
            </td>
          </tr>
        </table>

        <!-- Feature Launch Cards -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
          <tr>
            <td class="mobile-stack" width="50%" style="padding-right: 8px; vertical-align: top;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                <span style="font-size: 20px; display: block; margin-bottom: 4px;">📲</span>
                <span style="font-size: 14px; font-weight: 800; color: #0f172a; display: block;">Table QR Codes</span>
                <span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block; margin-top: 3px;">
                  Print-ready acrylic table stand designs unlocked in Dashboard Settings.
                </span>
              </div>
            </td>
            <td class="mobile-stack" width="50%" style="padding-left: 8px; vertical-align: top;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                <span style="font-size: 20px; display: block; margin-bottom: 4px;">⚡</span>
                <span style="font-size: 14px; font-weight: 800; color: #0f172a; display: block;">Live Kitchen KDS</span>
                <span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block; margin-top: 3px;">
                  Zero-latency sound chime orders ready for your chefs and tablets.
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Primary CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard" class="btn-glow" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35); letter-spacing: 0.3px;">
                Launch Restaurant Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, `Congratulations! ${restaurantName} is verified and live on Sofra.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. DOCUMENT REJECTED / CHANGES REQUESTED
    // ─────────────────────────────────────────────────────────────
    case "DOCUMENT_REJECTED":
    case "VERIFICATION_CHANGES_REQUESTED": {
      const documentType = data.documentType || "Trade License";
      const reason = data.reason || data.message || "Document scan is blurry or missing the official regional revenue stamp. Please re-upload a clean color PDF.";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.18);">
                <span style="font-size: 30px;">⚠️</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #fef3c7; color: #b45309; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #fde68a;">
                Action Required
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Update Required: ${documentType}
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 440px;">
                Our compliance team reviewed your submission and flagged an item that needs a quick correction.
              </p>
            </td>
          </tr>
        </table>

        <!-- Auditor Note -->
        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; border-radius: 0 14px 14px 0; padding: 18px 20px; margin-bottom: 28px;">
          <span style="font-size: 11px; font-weight: 800; color: #9a3412; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">
            Auditor Findings & Reason
          </span>
          <p style="margin: 0; color: #7c2d12; font-size: 14px; line-height: 1.6; font-weight: 600;">
            "${reason}"
          </p>
        </div>

        <!-- Next Steps Checklist -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin-bottom: 28px;">
          <span style="font-size: 12px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 8px;">
            Quick Resolution Checklist:
          </span>
          <ul style="margin: 0; padding-left: 18px; color: #64748b; font-size: 13px; line-height: 1.7;">
            <li>Ensure all 4 corners of the document are visible without glare.</li>
            <li>Verify legal business name matches your registered restaurant profile.</li>
            <li>Upload high-resolution color PDF or scan (up to 10MB).</li>
          </ul>
        </div>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard/verification" class="btn-glow" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35); letter-spacing: 0.3px;">
                Re-upload in Verification Center &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, `Action required on your ${documentType} verification submission.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 7. VERIFICATION REJECTED
    // ─────────────────────────────────────────────────────────────
    case "VERIFICATION_REJECTED": {
      const reason = data.reason || data.message || "Application could not be verified under current regulatory criteria.";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.18);">
                <span style="font-size: 30px;">❌</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #fecaca;">
                Application Declined
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Verification Unsuccessful
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 440px;">
                We regret to inform you that your restaurant verification could not be approved at this time.
              </p>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 28px;">
          <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">
            Auditor Findings
          </span>
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
            "${reason}"
          </p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="mailto:support@sofra.com?subject=Verification%20Appeal" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Contact Support Desk &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, "Update on your Sofra restaurant verification application.");
    }

    // ─────────────────────────────────────────────────────────────
    // 8. SUBSCRIPTION EXPIRING SOON (7-DAY RENEWAL ALERT)
    // ─────────────────────────────────────────────────────────────
    case "SUBSCRIPTION_EXPIRING_7_DAYS": {
      const planName = data.planName || "Pro Plan";
      const daysRemaining = data.daysRemaining || 7;
      const expiryDate = data.expiryDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 1px solid #c7d2fe; text-align: center; line-height: 64px; display: inline-block; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.18);">
                <span style="font-size: 30px;">⏳</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px; border: 1px solid #c7d2fe;">
                Billing Notice &bull; ${daysRemaining} Days Remaining
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Your ${planName} Renews on ${expiryDate}
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 440px;">
                Keep your restaurant running smoothly without any interruption to digital menu QR codes or live kitchen ordering.
              </p>
            </td>
          </tr>
        </table>

        <!-- Plan Protection Box -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 22px; margin-bottom: 28px;">
          <tr>
            <td width="40" valign="top">
              <span style="font-size: 26px;">🛡️</span>
            </td>
            <td valign="top" style="padding-left: 12px;">
              <span style="font-size: 14px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 4px;">
                Preserve All Active Restaurant Features
              </span>
              <span style="font-size: 12px; color: #64748b; line-height: 1.6; display: block;">
                Your subscription protects unlimited tableside QR ordering, real-time Telebirr checkout, staff KDS tablet sessions, and weekly revenue analytics.
              </span>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard/billing" class="btn-glow" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); letter-spacing: 0.3px;">
                Renew Subscription in Billing Portal &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, `Reminder: Your Sofra ${planName} subscription expires in ${daysRemaining} days.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 9. RESTAURANT STATUS CHANGED (SUSPENDED / REACTIVATED)
    // ─────────────────────────────────────────────────────────────
    case "RESTAURANT_STATUS_CHANGED": {
      const message = data.message || "Your restaurant operating status has been updated by administration.";
      const isReactivated = message.toLowerCase().includes("reactivate") || message.toLowerCase().includes("unblock");

      const icon = isReactivated ? "🟢" : "⏸️";
      const title = isReactivated ? "Restaurant Account Reactivated" : "Restaurant Account Suspended";
      const badgeColor = isReactivated ? "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;" : "background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 64px; height: 64px; border-radius: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: center; line-height: 64px; display: inline-block;">
                <span style="font-size: 30px;">${icon}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="${badgeColor} font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px;">
                Operating Status Alert
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                ${title}
              </h1>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin-bottom: 28px;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
            ${message}
          </p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Open Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, `Account status update for your Sofra restaurant profile.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 10. DEFAULT / GENERAL NOTIFICATION FALLBACK
    // ─────────────────────────────────────────────────────────────
    default: {
      const subject = data.message || "You have a new operational notice regarding your Sofra restaurant profile.";

      const content = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 60px; height: 60px; border-radius: 20px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fdba74; text-align: center; line-height: 60px; display: inline-block;">
                <span style="font-size: 28px;">📢</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 18px;">
              <span style="background-color: #ffedd5; color: #9a3412; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 12px; border-radius: 9999px;">
                Platform Dispatch
              </span>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Notice from Sofra
              </h1>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
            ${subject.replace(/\n/g, "<br>")}
          </p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${frontendUrl}/dashboard" class="btn-glow" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 12px; display: inline-block;">
                Open Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
      return wrapInEmailShell(content, "New operational notification from Sofra Restaurant Platform.");
    }
  }
}

/**
 * Returns complete, realistic sample data for previewing and test emails.
 */
export function getSampleDataForTemplate(type: string, restaurantName: string = "Bole Bistro Addis"): EmailTemplateData {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  switch (type) {
    case "NEW_ORDER":
    case "ORDER_ACCEPTED":
    case "ORDER_READY":
    case "ORDER_DELIVERED":
    case "ORDER_CANCELLED":
      return {
        restaurantName,
        message: "Your culinary order is being processed with real-time updates.",
        order: {
          _id: "66d4e5f7a1b2c3d4e5f6a7b8",
          customerName: "Abebe Kebede",
          customerPhone: "+251 91 123 4567",
          paymentMethod: "Telebirr (Mobile Money)",
          tableNumber: "Table 4",
          totalAmount: 645.0,
          items: [
            { name: "Special Doro Wat Combo", quantity: 2, price: 260.0 },
            { name: "Spiced Tej Honey Wine (Glass)", quantity: 2, price: 62.5 },
          ],
          notes: "Please serve injera extra warm and hot berbere on the side.",
          createdAt: new Date(),
        },
      };

    case "VERIFICATION_APPROVED":
      return {
        restaurantName,
        message: "Congratulations! Your restaurant verification has been fully verified and approved by Sofra Compliance.",
        actionUrl: `${frontendUrl}/dashboard`,
      };

    case "DOCUMENT_REJECTED":
      return {
        restaurantName,
        documentType: "Commercial Business License & Food Hygiene Certificate",
        reason: "The uploaded scan was blurry and missing the official regional trade bureau revenue stamp. Please upload a clear color PDF scan.",
        actionUrl: `${frontendUrl}/dashboard/verification`,
      };

    case "VERIFICATION_CHANGES_REQUESTED":
      return {
        restaurantName,
        message: "Our verification team noted a small discrepancy in the registered business TIN vs the bank account name. Please update your business documents.",
        actionUrl: `${frontendUrl}/dashboard/verification`,
      };

    case "SUBSCRIPTION_EXPIRING_7_DAYS":
    case "SUBSCRIPTION_EXPIRING_TODAY":
    case "SUBSCRIPTION_AUTO_RENEWED":
      return {
        restaurantName,
        planName: "Pro Multi-Table Plan",
        daysRemaining: type === "SUBSCRIPTION_EXPIRING_7_DAYS" ? 7 : 0,
        expiryDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        actionUrl: `${frontendUrl}/dashboard/billing`,
      };

    case "PASSWORD_RESET":
      return {
        restaurantName,
        recipientName: "Owner",
        resetUrl: `${frontendUrl}/reset-password?token=sofra_sample_secure_token_1234567890`,
      };

    case "PASSWORD_CHANGED":
      return {
        restaurantName,
        recipientName: "Owner",
        changedAt: new Date().toUTCString(),
        ipAddress: "196.188.241.15 (Addis Ababa, Ethiopia)",
        actionUrl: `${frontendUrl}/dashboard/settings`,
      };

    default:
      return {
        restaurantName,
        message: "This is an important operational notice from the Sofra Restaurant Platform.",
        actionUrl: `${frontendUrl}/dashboard`,
      };
  }
}
