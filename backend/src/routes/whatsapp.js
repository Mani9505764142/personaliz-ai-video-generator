const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappWebService');
const QRCode = require('qrcode');

// Get WhatsApp status and QR code
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    let qrCodeDataUrl = null;
    if (status.qrCode) {
      // Generate QR code as base64 data URL
      qrCodeDataUrl = await QRCode.toDataURL(status.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
    
    res.json({
      success: true,
      status: {
        isReady: status.isReady,
        hasQR: status.hasQR,
        qrCode: qrCodeDataUrl,
        message: status.isReady 
          ? 'WhatsApp is ready to send FREE videos to contacts!' 
          : status.hasQR 
            ? 'Please scan QR code with WhatsApp to enable FREE messaging'
            : 'Initializing FREE WhatsApp Web service...'
      }
    });
  } catch (error) {
    console.error('❌ WhatsApp status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get delivery records
router.get('/deliveries', async (req, res) => {
  try {
    const records = await whatsappService.getDeliveryRecords();
    res.json({
      success: true,
      deliveries: records.slice(-50) // Return last 50 records
    });
  } catch (error) {
    console.error('❌ Failed to get delivery records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test WhatsApp connection
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber, testMessage } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    const status = whatsappService.getStatus();
    if (!status.isReady) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp is not ready. Please scan QR code first.'
      });
    }
    
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    let chatId = cleanPhone;
    if (!cleanPhone.startsWith('+')) {
      chatId = `+${cleanPhone}`;
    }
    chatId = `${chatId.replace(/[^\d]/g, '')}@c.us`;
    
    // Send test message
    const message = testMessage || `🧪 Test message from Enhanced Video Generator!

✅ WhatsApp integration is working perfectly!
📱 FREE messaging via WhatsApp Web.js
🎉 Ready to send personalized videos!`;
    
    const result = await whatsappService.client.sendMessage(chatId, message);
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      messageId: result.id.id,
      phoneNumber: cleanPhone
    });
    
  } catch (error) {
    console.error('❌ WhatsApp test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
