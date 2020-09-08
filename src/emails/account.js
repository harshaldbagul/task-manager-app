const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'harshaldbagul8@gmail.com',
        subject: 'Sending from SendGrid',
        html: `<strong>Thanks for joining ${name}</strong>`,
    });
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'harshaldbagul8@gmail.com',
        subject: 'Sending from SendGrid',
        text: `You are removed from the App ${name}`,
    });
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
};