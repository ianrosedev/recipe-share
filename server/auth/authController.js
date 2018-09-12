import { signToken } from './auth';

const loginPost = (req, res) => {
  const token = signToken(req.user._id);

  return res.json({ token });
};

export default {
  loginPost
};
