import { Resend } from 'resend';
import logger from './logger';

/**
 * Email utility for CineSwipe.
 * 
 * Configured with Resend (https://resend.com)
 */

export async function sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
): Promise<void> {
    const resetUrl = `${process.env.APP_URL || 'https://cineswipe.com'}/reset-password?token=${resetToken}`;
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
        try {
            const resend = new Resend(apiKey);
            const fromEmail = process.env.EMAIL_FROM || 'CineSwipe <onboarding@resend.dev>';
            
            await resend.emails.send({
                from: fromEmail,
                to: toEmail,
                subject: 'Reset Your CineSwipe Password',
                html: `
                    <h2>Password Reset</h2>
                    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                    <p><a href="${resetUrl}" style="background-color: #E50914; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                `,
            });
            logger.info({ toEmail }, 'Password reset email sent via Resend');
        } catch (error) {
            logger.error({ err: error, toEmail }, 'Failed to send password reset email via Resend');
            throw error;
        }
    } else {
        // Dev mode fallback
        logger.info(
            { toEmail, resetUrl },
            'Password reset requested (DEV MODE) — no RESEND_API_KEY configured.',
        );
    }
}
