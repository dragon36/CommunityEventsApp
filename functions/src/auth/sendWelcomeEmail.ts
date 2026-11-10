import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();

// Configure email transporter (use environment variables in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  if (!email) {
    functions.logger.info(`User ${uid} has no email, skipping welcome email`);
    return;
  }

  // Check if user has email notifications enabled
  const prefsDoc = await db.collection('notificationPreferences').doc(uid).get();
  const prefs = prefsDoc.data();

  if (prefs?.channels?.email?.enabled === false) {
    functions.logger.info(`User ${uid} has email notifications disabled`);
    return;
  }

  try {
    const appName = process.env.APP_NAME || 'Community Events';
    const appUrl = process.env.APP_URL || 'https://communityevents.app';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@communityevents.app';

    const mailOptions = {
      from: `"${appName}" <noreply@${process.env.EMAIL_DOMAIN || 'communityevents.app'}>`,
      to: email,
      subject: `Welcome to ${appName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${appName}! 🎉</h1>
          </div>

          <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
            <p style="font-size: 18px; color: #333;">Hi ${displayName || 'there'},</p>

            <p>Thanks for joining ${appName}! We're excited to help you discover and share amazing events in your community.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4285F4;">
              <h3 style="margin-top: 0; color: #4285F4;">What you can do:</h3>
              <ul style="padding-left: 20px;">
                <li>🔍 <strong>Discover events</strong> near you</li>
                <li>📅 <strong>Create your own events</strong> and invite friends</li>
                <li>🗺️ <strong>Get directions</strong> to event venues</li>
                <li>📲 <strong>Add to calendar</strong> with one tap</li>
                <li>👥 <strong>Connect with friends</strong> and see what they're attending</li>
                <li>🔔 <strong>Get notified</strong> about events you care about</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/get-started" style="background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Get Started
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              You received this email because you signed up for ${appName}.<br>
              <a href="${appUrl}/settings/notifications" style="color: #4285F4;">Manage email preferences</a> |
              <a href="${appUrl}/unsubscribe" style="color: #4285F4;">Unsubscribe</a>
            </p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    functions.logger.info(`Sent welcome email to ${email}`);
  } catch (error) {
    functions.logger.error(`Error sending welcome email to ${email}:`, error);
    // Don't throw - we don't want to fail the user creation
  }
});