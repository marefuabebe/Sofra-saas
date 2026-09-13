import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User";
import PasswordResetToken from "../models/PasswordResetToken";
import EmailService from "../services/emailService";

// Validation for password reset
const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Constant-safe generic response
    const genericResponse = { 
      success: true, 
      message: "If an account exists for this email, password reset instructions have been sent." 
    };

    const user = await User.findOne({ email: normalizedEmail, role: { $in: ["owner", "staff"] } });
    
    if (!user || !user.isActive) {
      // Do not reveal that the user does not exist
      return res.json(genericResponse);
    }

    // 1. Generate secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // 2. Hash the token for storage (SHA-256 is fast and secure enough for 256-bit random tokens)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    // 3. Set expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // 4. Invalidate any existing tokens for this user before creating a new one (Bulk Invalidation)
    await PasswordResetToken.deleteMany({ userId: user._id });

    // 5. Store hashed token
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    // 6. Send email
    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}`;
    
    // Fire and forget to not block response
    EmailService.sendPasswordResetEmail(user.email, resetUrl).catch(err => {
      console.error("[PasswordReset] Failed to send email:", err);
    });

    return res.json(genericResponse);
  } catch (error) {
    console.error("[forgotPassword]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: (parseResult.error as any).issues?.[0]?.message || (parseResult.error as any).errors?.[0]?.message || "Invalid input" 
      });
    }

    const { token, newPassword } = parseResult.data;

    // Hash incoming token to match database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token (must not be expired, must not be used)
    // We use findOneAndUpdate for atomic consumption
    const resetRecord = await PasswordResetToken.findOneAndUpdate(
      { 
        tokenHash, 
        expiresAt: { $gt: new Date() },
        usedAt: { $exists: false }
      },
      { 
        $set: { usedAt: new Date() } 
      },
      { new: true } // Return updated document
    );

    if (!resetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Find the user
    const user = await User.findById(resetRecord.userId);
    if (!user || !user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: "Account disabled or not found" 
      });
    }

    // Hash the new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update user password and passwordChangedAt timestamp
    user.password_hash = password_hash;
    user.tempPassword = false;
    user.passwordChangedAt = new Date(); // This invalidates all existing JWTs for this user
    await user.save();

    // Bulk invalidate any other outstanding tokens for this user
    await PasswordResetToken.deleteMany({ 
      userId: user._id, 
      _id: { $ne: resetRecord._id } 
    });

    // Send security notification email
    EmailService.sendPasswordChangedEmail(user.email).catch(err => {
      console.error("[PasswordReset] Failed to send security email:", err);
    });

    return res.json({ 
      success: true, 
      message: "Password has been successfully reset. You can now log in." 
    });

  } catch (error) {
    console.error("[resetPassword]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
