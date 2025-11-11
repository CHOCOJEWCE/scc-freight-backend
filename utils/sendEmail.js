import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html, options = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SCC Freight" <freightscc@gmail.com>',
      to,
      subject,
      html,
      // ✅ Always BCC yourself for visibility
      bcc: options.bcc || "freightscc@gmail.com",
    };

    // ✅ Log outgoing message
    console.log(`
==============================
📧 Sending Email
To: ${to}
Subject: ${subject}
BCC: ${mailOptions.bcc}
==============================
`);

    const info = await transporter.sendMail(mailOptions);

    // ✅ Log successful send info
    console.log(`
✅ Email sent successfully!
Message ID: ${info.messageId}
Preview URL (if dev): ${nodemailer.getTestMessageUrl(info) || "N/A"}
==============================
`);

    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email failed to send");
  }
};

export default sendEmail;
