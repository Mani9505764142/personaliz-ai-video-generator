// Simple webhook tracker for WhatsApp messages
const messageTracker = new Map();

function trackMessage(messageId, data) {
  messageTracker.set(messageId, {
    ...data,
    timestamp: new Date().toISOString()
  });
  console.log(Tracking