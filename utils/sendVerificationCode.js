const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
// Create a nodemailer transporter using SMTP transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASSWORD,
  },
});

async function sendVerificationCode(userEmailAddress) {
  // Generate a random verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + 2);

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userEmailAddress,
    subject: "Verification Code",
    html: `
              <p>Your verification code is: <strong>${verificationCode}</strong></p>
              <p>This code will expire at: ${expirationDate}</p>
              <img src="https://example.com/path/to/your/image.jpg" alt="Image" />
            `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);

    // Return verification code and expiration date
    return { code: verificationCode, expiration: expirationDate };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification code email");
  }
}

module.exports = { sendVerificationCode };
