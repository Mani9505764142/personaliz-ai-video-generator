const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', apiRoutes);
app.use('/api/whatsapp', whatsappRoutes);  // NEW: WhatsApp routes

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '🎬 Enhanced Personalized Video Generator with FREE WhatsApp Integration',
    status: 'Running',
    features: [
      'ElevenLabs Voice Cloning',
      'Wav2Lip Lip-Sync',
      'FREE WhatsApp Web.js Integration',
      'Docker Containerized'
    ]
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Video Server with FREE WhatsApp running on port ${PORT}`);
  console.log(`📱 WhatsApp Status: http://localhost:${PORT}/api/whatsapp/status`);
  console.log(`🎬 Video Generator: http://localhost:3000`);
  console.log(`💰 WhatsApp Delivery: FREE (No API costs)`);
});
