const Item = require('../models/Item');
const { sendEmail } = require('../../utils/emailService');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

// Test QR code generation
const generateTestQR = async () => {
    try {
        const testData = { test: 'Hello World' };
        const qrCode = await QRCode.toDataURL(JSON.stringify(testData));
        console.log('Test QR code generated successfully');
        return qrCode;
    } catch (error) {
        console.error('Test QR code generation failed:', error);
        throw error;
    }
};

// Send verification code to user
exports.sendVerificationCode = async (req, res) => {
    try {
        const { itemId, email } = req.body;
        console.log('Received request:', { itemId, email });

        // Validate input
        if (!itemId || !email) {
            return res.status(400).json({ message: 'Item ID and email are required' });
        }

        // Find the item
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        console.log('Found item:', item);

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Create text file with item information
        const txtFileName = `item_${item._id}_${Date.now()}.txt`;
        const txtFilePath = path.join(uploadsDir, txtFileName);
        
        // Create text content
        const textContent = `Item Information
------------------------
Item ID: ${item._id}
Title: ${item.title || 'N/A'}
Category: ${item.category || 'N/A'}
Description: ${item.description || 'N/A'}
Location: ${item.location || 'N/A'}
Date: ${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
Status: ${item.status || 'N/A'}
------------------------`;

        // Write text file
        await fs.writeFile(txtFilePath, textContent);
        console.log('Text file created successfully at:', txtFilePath);

        // Generate QR code as PNG file
        const qrFileName = `qr_${item._id}_${Date.now()}.png`;
        const qrFilePath = path.join(uploadsDir, qrFileName);
        
        try {
            // Generate QR code with text file content
            await QRCode.toFile(qrFilePath, textContent, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            console.log('QR code generated successfully at:', qrFilePath);
        } catch (qrError) {
            console.error('Error generating QR code:', qrError);
            throw new Error('Failed to generate QR code');
        }

        // Read QR code file and convert to base64
        const qrImageBuffer = await fs.readFile(qrFilePath);
        const base64QR = qrImageBuffer.toString('base64');

        // Update item with QR code data
        item.qrCode = {
            base64: base64QR,
            createdAt: new Date()
        };
        await item.save();

        // Read text file for email attachment
        const txtFileBuffer = await fs.readFile(txtFilePath);

        // Send email with QR code and text file
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Item Claim QR Code</h2>
                <p>Hello,</p>
                <p>You have requested to claim the following item:</p>
                <ul>
                    <li><strong>Item ID:</strong> ${item._id}</li>
                    <li><strong>Item Name:</strong> ${item.title || 'N/A'}</li>
                    <li><strong>Category:</strong> ${item.category || 'N/A'}</li>
                    <li><strong>Description:</strong> ${item.description || 'N/A'}</li>
                    <li><strong>Location:</strong> ${item.location || 'N/A'}</li>
                    <li><strong>Date:</strong> ${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</li>
                </ul>
                <p>Please present this QR code to the admin to claim your item:</p>
                <div style="text-align: center; margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <img src="cid:qr-code" alt="Item Claim QR Code" style="max-width: 300px; border: 1px solid #ddd; padding: 10px; background-color: white;">
                </div>
                <p style="color: #666; font-size: 14px;">Note: This QR code contains your item details and will be used to verify your claim.</p>
                <p>If you did not request this QR code, please ignore this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
            </div>
        `;

        console.log('Attempting to send email to:', email);
        
        const emailData = {
            to: email,
            subject: 'Item Claim QR Code',
            html: emailHtml,
            attachments: [
                {
                    filename: qrFileName,
                    content: qrImageBuffer,
                    cid: 'qr-code'
                },
                {
                    filename: txtFileName,
                    content: txtFileBuffer
                }
            ]
        };

        console.log('Email data prepared:', {
            to: emailData.to,
            subject: emailData.subject,
            hasAttachments: !!emailData.attachments,
            attachmentFilenames: emailData.attachments.map(a => a.filename)
        });

        await sendEmail(emailData);
        console.log('Email sent successfully');

        // Clean up the files
        await fs.unlink(qrFilePath);
        await fs.unlink(txtFilePath);
        console.log('Files cleaned up');

        res.json({
            message: 'QR code and text file sent successfully'
        });
    } catch (error) {
        console.error('Detailed error in sendVerificationCode:', error);
        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }
        res.status(500).json({ 
            message: 'Error sending QR code and text file',
            error: error.message,
            details: error.response?.body || 'No additional details'
        });
    }
};

// Verify claim using QR code
exports.verifyClaim = async (req, res) => {
    try {
        const { qrData, firstName, lastName, email, phoneNumber } = req.body;

        // Validate input
        if (!qrData || !firstName || !lastName || !email || !phoneNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Parse QR code data (plain text)
        const lines = qrData.split('\n');
        const itemIdLine = lines.find(line => line.startsWith('Item ID: '));
        
        if (!itemIdLine) {
            return res.status(400).json({ message: 'Invalid QR code format' });
        }

        // Extract item ID from the line
        const itemId = itemIdLine.split(': ')[1];

        // Find the item
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if item is already claimed
        if (item.status === 'claimed') {
            return res.status(400).json({ message: 'Item has already been claimed' });
        }

        // Update item with claim details
        item.status = 'claimed';
        item.claimedBy = {
            firstName,
            lastName,
            email,
            phoneNumber,
            claimedAt: new Date()
        };
        await item.save();

        res.json({
            success: true,
            message: 'Item claimed successfully',
            item: {
                id: item._id,
                title: item.title,
                status: item.status,
                claimedBy: item.claimedBy
            }
        });
    } catch (error) {
        console.error('Error verifying claim:', error);
        res.status(500).json({ message: 'Error verifying claim' });
    }
}; 