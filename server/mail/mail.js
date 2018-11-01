import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import hbs from 'nodemailer-express-handlebars';

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.MAIL_CLIENT_ID,
  process.env.MAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.MAIL_REFRESH_TOKEN
});

const accessToken = oauth2Client.refreshAccessToken()
  .then(res => res.credentials.access_token)
  .catch(err => console.log(err));

const smtpTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'ianrosedev@gmail.com',
    clientId: process.env.MAIL_CLIENT_ID,
    clientSecret: process.env.MAIL_CLIENT_SECRET,
    refreshToken: process.env.MAIL_REFRESH_TOKEN,
    accessToken
  }
});

// Use handlebars for email template
smtpTransport.use('compile', hbs({
  viewEngine: 'express-handlebars',
  viewPath: __dirname + '/views',
  extName: '.hbs'
}));

export default smtpTransport;
