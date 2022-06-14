var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: process.env.EMAILHOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass:  process.env.EMAILPASSWORD
  }
});

class Messenger {
  
    static sendEmail(adress, title, text) {
        var mailOptions = {
            from: process.env.EMAIL,
            to: adress,
            subject: title,
            text: text
        };
        return transporter.sendMail(mailOptions)
    }
}

exports.messenger = Messenger;
