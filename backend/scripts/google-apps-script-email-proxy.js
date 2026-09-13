/**
 * ============================================================================
 * SOFRA Platform - Google Apps Script (GAS) Email HTTP Proxy
 * ============================================================================
 * 
 * WHY IS THIS NEEDED?
 * -------------------
 * Free cloud hosting platforms (like Render.com) block outbound SMTP connections 
 * (ports 25, 465, 587) to prevent spam abuse. Furthermore, transactional email 
 * services like Resend or SendGrid require a verified custom domain, which users 
 * with standard @gmail.com accounts do not have.
 * 
 * This Google Apps Script acts as an authenticated HTTPS proxy running on Google's
 * servers. Render makes an HTTPS POST request (port 443, never blocked) to this 
 * Web App, and Google Apps Script sends the email natively from your Gmail account
 * using Google's GmailApp service.
 * 
 * Free Quota:
 * - Standard @gmail.com: 100 emails / day (more than enough for password resets, alerts, receipts)
 * - Google Workspace: 1,500 emails / day
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * ------------------------
 * 1. Go to https://script.google.com/ and sign in with your Gmail account.
 * 2. Click "+ New project" (top left).
 * 3. Rename the project to "SOFRA Email Proxy" (click on "Untitled project").
 * 4. Delete any code in Code.gs, paste THIS ENTIRE FILE, and click Save (Ctrl+S).
 * 
 * 5. (OPTIONAL) Set an API Key for security:
 *    - Click Project Settings (gear icon on the left).
 *    - Scroll down to "Script Properties" and click "Edit script properties".
 *    - Add property: Name = "API_KEY", Value = "choose_a_strong_secret_token"
 *    - Or you can leave it blank / set DEFAULT_API_KEY below.
 * 
 * 6. Deploy as a Web App:
 *    - Click the blue "Deploy" button (top right) -> "New deployment".
 *    - Next to "Select type", click the gear icon and choose "Web app".
 *    - Description: "SOFRA Email Webhook"
 *    - Execute as: "Me (your-email@gmail.com)"  <-- CRITICAL
 *    - Who has access: "Anyone"                <-- CRITICAL
 *    - Click "Deploy".
 *    - Click "Authorize access" -> choose your Google Account.
 *    - If Google shows "Google hasn't verified this app", click "Advanced" -> 
 *      "Go to SOFRA Email Proxy (unsafe)" -> Click "Allow".
 *    - Copy the "Web app URL" (format: https://script.google.com/macros/s/.../exec).
 * 
 * 7. In your Render Dashboard (or backend/.env):
 *    Add environment variables:
 *    GAS_EMAIL_URL=https://script.google.com/macros/s/AKfycb.../exec
 *    GAS_API_KEY=choose_a_strong_secret_token (if configured in step 5)
 * ============================================================================
 */

// Fallback API key if not defined in Script Properties (Optional security)
var DEFAULT_API_KEY = "";

/**
 * Handle incoming POST requests from the SOFRA backend
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests
  try {
    lock.waitLock(10000);
  } catch (lockError) {
    return respondJson({
      success: false,
      error: "Server busy, unable to acquire lock. Please retry."
    });
  }

  try {
    var data;

    // Parse JSON payload from request body
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        return respondJson({
          success: false,
          error: "Invalid JSON format in request body: " + jsonErr.toString()
        });
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      return respondJson({
        success: false,
        error: "No payload provided."
      });
    }

    // Check API Key security (if configured in Script Properties or DEFAULT_API_KEY)
    var expectedApiKey = PropertiesService.getScriptProperties().getProperty("API_KEY") || DEFAULT_API_KEY;
    if (expectedApiKey && expectedApiKey.trim().length > 0) {
      var providedApiKey = data.apiKey || (e.parameter && e.parameter.apiKey);
      if (providedApiKey !== expectedApiKey) {
        return respondJson({
          success: false,
          error: "Unauthorized: Invalid or missing API key."
        });
      }
    }

    // Validate required fields
    var to = data.to;
    var subject = data.subject;
    var html = data.html || "";
    var text = data.text || "Please view this email in an HTML-compatible client.";
    var fromName = data.fromName || "SOFRA Platform";
    var replyTo = data.replyTo || "";

    if (!to) {
      return respondJson({ success: false, error: "Missing required parameter: 'to'" });
    }
    if (!subject) {
      return respondJson({ success: false, error: "Missing required parameter: 'subject'" });
    }

    // Check remaining daily email quota
    var quotaRemaining = MailApp.getRemainingDailyQuota();
    if (quotaRemaining <= 0) {
      return respondJson({
        success: false,
        error: "Gmail daily sending quota exhausted. Remaining: 0"
      });
    }

    // Build email options
    var mailOptions = {
      name: fromName,
      htmlBody: html
    };

    if (replyTo && replyTo.trim().length > 0) {
      mailOptions.replyTo = replyTo.trim();
    }

    // Send email via GmailApp
    GmailApp.sendEmail(to, subject, text, mailOptions);

    return respondJson({
      success: true,
      message: "Email sent successfully via Google Apps Script proxy",
      quotaRemaining: MailApp.getRemainingDailyQuota(),
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return respondJson({
      success: false,
      error: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET requests for health check and diagnostic inspection
 */
function doGet(e) {
  var quotaRemaining = MailApp.getRemainingDailyQuota();
  return respondJson({
    status: "ONLINE",
    service: "SOFRA Email Proxy (Google Apps Script)",
    dailyQuotaRemaining: quotaRemaining,
    timestamp: new Date().toISOString(),
    message: "GAS Email HTTP Proxy is healthy and ready to receive POST requests."
  });
}

/**
 * Helper to return a JSON response with proper MimeType
 */
function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
