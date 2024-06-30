function generateReferralId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralId = '';
    for (let i = 0; i < 6; i++) {
      referralId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return referralId;
  }
  
  module.exports = generateReferralId;
  