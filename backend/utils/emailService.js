require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate a random verification code
exports.generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Send email using Nodemailer
exports.sendEmail = async ({ to, subject, html, attachments }) => {
    try {
        // Validate required fields
        if (!to || !subject || !html) {
            throw new Error('Missing required email fields');
        }

        // Validate sender email
        const from = process.env.EMAIL_USER;
        if (!from) {
            console.error('Environment variables:', {
                EMAIL_USER: process.env.EMAIL_USER,
                EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set'
            });
            throw new Error('EMAIL_USER is not set in environment variables');
        }

        console.log('Preparing to send email:', { to, from, subject, hasAttachments: !!attachments });

        // Prepare the message object
        const mailOptions = {
            from,
            to,
            subject,
            html,
            attachments: attachments || []
        };

        console.log('Sending email with Nodemailer...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        console.log('Email sent to:', to);
        return true;
    } catch (error) {
        console.error('Nodemailer error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
}; 