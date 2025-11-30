const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
// For development, we use Ethereal Email (fake SMTP)
const createTransporter = async () => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    console.log('Email Transporter Configured');
    console.log('Ethereal User:', testAccount.user);

    return transporter;
};

module.exports = { createTransporter };
