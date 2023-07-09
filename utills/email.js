const nodeMailer = require('nodemailer');

// const transporter = nodeMailer.createTransport({
//   host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
//   port: process.env.EMAIL_PORT || 25,
//   auth: {
//     user: process.env.EMAIL_USERNAME || '618d4125b8829a',
//     pass: process.env.EMAIL_PASSWORD || 'f1883b90a04587',
//   },
// });

const sendEmail = async (options) => {
  // 1. create a transporter
  const transporter = nodeMailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2. Define the email options
  const mailOptions = {
    from: options.email,
    to: process.env.EMAIL_USERNAME,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3. send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
