const nodeMailer = require('nodemailer');
// const pool = require('./db'); // Import the database connection

const sendEmail = async (subject, message, send_to, sender, reply_to) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const options = {
        from: sender,
        to: send_to,
        replyTo: reply_to,
        subject: subject,
        html: message,
    };

    try {
        const info = await transporter.sendMail(options);
        console.log(info);
        await pool.query(
            'INSERT INTO sent_emails(subject, message, send_to, sender, reply_to, sent_at) VALUES($1, $2, $3, $4, $5, NOW())',
            [subject, message, send_to, sender, reply_to]
        );

        console.log('Email logged to database successfully.');
    } catch (err) {
        console.error('Error sending email:', err);
    }
};

module.exports = sendEmail;
