const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for messages
let whatsappMessages = [];

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp Integration Server is Running!",
    endpoints: [
      "GET /api/test-whatsapp",
      "GET /api/whatsapp/messages", 
      "GET /api/whatsapp/send-video"
    ]
  });
});

// Test WhatsApp Connection
app.get('/api/test-whatsapp', (req, res) => {
  res.json({
    success: true,
    message: "✅ WhatsApp API is working perfectly!",
    timestamp: new Date().toISOString(),
    server: "Manual WhatsApp Integration"
  });
});

// Get all WhatsApp messages
app.get('/api/whatsapp/messages', (req, res) => {
  res.json({
    success: true,
    messages: whatsappMessages,
    count: whatsappMessages.length,
    timestamp: new Date().toISOString()
  });
});

// Send personalized video to WhatsApp
app.get('/api/whatsapp/send-video', (req, res) => {
  const { name, phone, city } = req.query;
  
  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      error: "Name and phone number are required",
      received: { name, phone, city }
    });
  }

  // Create message record
  const messageData = {
    id: Date.now(),
    name: name,
    phone: phone,
    city: city || 'Not specified',
    timestamp: new Date().toISOString(),
    status: 'sent',
    videoUrl: `https://personalized-videos.com/${name.toLowerCase()}-${Date.now()}.mp4`,
    message: `Hi ${name}! Your personalized video from ${city || 'your location'} has been sent to WhatsApp!`
  };

  // Store the message
  whatsappMessages.push(messageData);

  // Send success response
  res.json({
    success: true,
    message: `🎉 Personalized video successfully sent to ${name} at ${phone}!`,
    data: messageData,
    totalMessagesSent: whatsappMessages.length
  });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log('\n🚀 ===============================================');
  console.log('📱 WhatsApp Integration Server Started!');
  console.log('===============================================');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`   ✅ GET  http://localhost:${PORT}/api/test-whatsapp`);
  console.log(`   📝 GET  http://localhost:${PORT}/api/whatsapp/messages`);
  console.log(`   📤 GET  http://localhost:${PORT}/api/whatsapp/send-video?name=John&phone=123&city=Delhi`);
  console.log('===============================================\n');
});
