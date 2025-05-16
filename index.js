const { Boom } = require('@hapi/boom');
const makeWASocket = require('@adiwajshing/baileys').default;
const qrcode = require('qrcode-terminal');
const smmApi = require('./smm-api');
const { handleSession, verifyCode } = require('./sessions');

require('dotenv').config();

// Session storage
const userSessions = new Map();

async function startBot() {
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: {
      creds: {},
      keys: {}
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') setTimeout(startBot, 5000);
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const userPhone = msg.key.remoteJid;
    const userMessage = msg.message.conversation || '';

    try {
      const session = handleSession(userSessions, userPhone);
      
      if (!session.verified) {
        await handleVerification(sock, userPhone, userMessage, session);
        return;
      }

      await handleCommands(sock, userPhone, userMessage);
    } catch (error) {
      console.error('Error:', error);
      await sock.sendMessage(userPhone, { text: '❌ Error processing request' });
    }
  });
}

// Verification Flow
async function handleVerification(sock, userPhone, message, session) {
  if (!session.username) {
    session.username = message;
    await smmApi.sendVerificationCode(message, session.code);
    return sock.sendMessage(userPhone, { 
      text: `📨 Verification code sent to your ticket. Reply with the 5-digit code.` 
    });
  }

  if (verifyCode(session, message)) {
    session.verified = true;
    return sock.sendMessage(userPhone, { 
      text: `✅ Verified! Now you can send commands:\n\n` +
            `Format: *orderID1,orderID2 action*\n` +
            `Example: *123,456 refill*\n\n` +
            `Available actions: refill, cancel, speed, complete without done`
    });
  }

  await sock.sendMessage(userPhone, { text: '❌ Invalid code. Please try again.' });
}

// Command Processing
async function handleCommands(sock, userPhone, message) {
  const command = parseCommand(message);
  if (!command) {
    return sock.sendMessage(userPhone, {
      text: '⚠️ Invalid command format. Use: *orderIDs action* (e.g., "1,2 refill")'
    });
  }

  const response = await smmApi.processOrderCommand(command);
  await sock.sendMessage(userPhone, { text: `📊 Result: ${response.message}` });
}

// Command Parser
function parseCommand(text) {
  const pattern = /^(\d+(?:,\d+)*)\s+(refill|cancel|speed|complete without done)$/i;
  const match = text.match(pattern);
  return match ? { 
    orderIds: match[1].split(','), 
    action: match[2] 
  } : null;
}

startBot().catch(err => console.log('Bot error:', err));