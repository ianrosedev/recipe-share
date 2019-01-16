import isEmail from 'isemail';
import { signToken } from './auth';
import smtpTransport from '../mail';
import { asyncMiddleware } from '../helpers/async';
import { errorResponse } from '../helpers/error';
import { dataResponse } from '../helpers/response';
import User from '../api/user/userModel';

const loginPost = (req, res) => {
  const token = signToken(req.user._id);

  return res.json({ token });
};

const requestPasswordReset = asyncMiddleware(async (req, res, next) => {
  const userEmail = req.body.email.trim();

  if (!userEmail) {
    errorResponse.customBadRequest('Email required');
  }

  if (!isEmail.validate(userEmail)) {
    errorResponse.customBadRequest('Bad email address');
  }

  const user = await User.findOne({ email: userEmail }).lean();

  if (!user) {
    errorResponse.customBadRequest('No user with that email');
  }

  // WIP
  const mailOptions = {
    from: 'ianrosedev@gmail.com',
    to: userEmail,
    subject: 'Password Reset Request',
    template: 'passwordReset',
    context: {
      name: 'Ian',
      dog: 'Charlie',
    },
  };

  const sentMail = await smtpTransport.sendMail(mailOptions);
  smtpTransport.close();

  if (!sentMail || !sentMail.accepted.includes(userEmail)) {
    errorResponse.serverError();
  }

  res.json(dataResponse({ message: `Email sent to ${userEmail}` }));
});

export default {
  loginPost,
  requestPasswordReset,
};
