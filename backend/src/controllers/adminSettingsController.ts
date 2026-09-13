import { Request, Response } from "express";
import SystemSettings from "../models/SystemSettings";

/**
 * Get Global System Settings
 * Creates a default document if one doesn't exist (Singleton pattern).
 */
export const getSystemSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    let settings = await SystemSettings.findOne();
    
    // If no settings exist yet, create the default singleton
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error("[SystemSettings] Get Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Update Global System Settings
 */
export const updateSystemSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    const updateData = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(updateData);
      await settings.save();
    } else {
      settings = await SystemSettings.findOneAndUpdate(
        { _id: settings._id },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings
    });
  } catch (error: any) {
    console.error("[SystemSettings] Update Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Get Public Configuration
 * Exposes safe settings to the frontend (like currency, platform name)
 */
export const getPublicConfig = async (req: Request, res: Response): Promise<any> => {
  try {
    let settings = await SystemSettings.findOne();
    
    // Default fallback if settings haven't been created yet
    const config = settings ? {
      platformName: settings.platformName,
      currency: settings.currency,
      maintenance: settings.maintenance,
      dateFormat: settings.dateFormat,
      rowsPerPage: settings.rowsPerPage
    } : {
      platformName: "SOFRA",
      currency: "ETB (Br)",
      maintenance: false,
      dateFormat: "DD MMM, YYYY",
      rowsPerPage: 10
    };

    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error("[PublicConfig] Get Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
