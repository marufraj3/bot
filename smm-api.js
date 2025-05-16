const axios = require('axios');

const API_BASE = 'https://mothersmm.com/adminapi/v2';
const API_KEY = process.env.SMM_API_KEY;

module.exports = {
  async sendVerificationCode(username, code) {
    return axios.post(`${API_BASE}/tickets/add`, {
      username,
      message: `WhatsApp Verification Code: ${code}\n\nDo not share with anyone.`
    }, {
      headers: { 'X-Api-Key': API_KEY }
    });
  },

  async processOrderCommand(command) {
    const endpoint = {
      'refill': '/orders/refill',
      'cancel': '/orders/cancel',
      'speed': '/orders/speed',
      'complete without done': '/orders/complete'
    }[command.action];

    return axios.post(`${API_BASE}${endpoint}`, {
      order_ids: command.orderIds
    }, {
      headers: { 'X-Api-Key': API_KEY }
    });
  }
};