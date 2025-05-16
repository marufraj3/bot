const NodeCache = require('node-cache');
const sessionCache = new NodeCache({ stdTTL: 86400 }); // 24h expiry

module.exports = {
  handleSession(userPhone) {
    if (!sessionCache.has(userPhone)) {
      sessionCache.set(userPhone, {
        username: '',
        code: Math.floor(10000 + Math.random() * 90000),
        verified: false
      });
    }
    return sessionCache.get(userPhone);
  },

  verifyCode(session, code) {
    return session.code.toString() === code.trim();
  }
};