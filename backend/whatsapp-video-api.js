const express = require("express");
const router = express.Router();
let messages = [];

router.post("/send-video", (req, res) => {
  const { name, phone, city = "your city" } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone required" });
  }

  const messageId = "MSG_" + Date.now();
  messages.push({
    id: messageId, name, phone, city,
    status: "sent", timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: "✅ Personalized video sent to WhatsApp!",
    data: { messageId, name, phone, city }
  });
});

router.get("/messages", (req, res) => {
  res.json({ success: true, messages });
});

module.exports = router;