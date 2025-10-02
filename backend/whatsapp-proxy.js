const express = require(express);
const http = require(http);
const app = express();

// WhatsApp Routes
app.get(/api/test-whatsapp, (req, res) => {
  res.json({
    success: true,
    message: WhatsApp