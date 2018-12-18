import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import hbs from 'nodemailer-express-handlebars';
import config from '../config';

const { OAuth2 } = google.auth;

const oauth2Client = new OAuth2(
  config.mail.clientID,
  config.mail.clientSecret,
  'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({ refresh_token: config.mail.refreshToken });

const authHeaders = oauth2Client
  .getRequestHeaders()
  .then(headers => headers)
  .catch(err => new Error(err));

const smtpTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    authHeaders,
    type: 'OAuth2',
    user: 'ianrosedev@gmail.com',
    clientId: config.mail.clientID,
    clientSecret: config.mail.clientSecret,
    refreshToken: config.mail.refreshToken,
  },
});

// Use handlebars for email template
smtpTransport.use(
  'compile',
  hbs({
    viewEngine: 'express-handlebars',
    viewPath: `${__dirname}/views`,
    extName: '.hbs',
  })
);

export default smtpTransport;
