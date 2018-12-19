import Boom from 'boom';

export default (req, res, next) => {
  const err = Boom.notFound();

  return res.status(404).json(err.output.payload);
};
