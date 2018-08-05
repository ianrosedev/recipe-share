import { signToken } from './auth';

const login = (req, res) => {
  const token = signToken(req.user._id);

  return res.json({ token });
};

export default {
  login
};
