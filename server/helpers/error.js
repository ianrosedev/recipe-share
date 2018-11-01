import Boom from 'boom';

export const errorResponse = {
  searchNotFound(searchType = 'item') {
    throw Boom.badRequest(`No ${searchType} with that ID`);
  },
  invalidQuery() {
    throw Boom.badRequest('Invalid Query');
  },
  customBadRequest(message = 'Bad Request') {
    throw Boom.badRequest(message);
  },
  unauthorized() {
    throw Boom.unauthorized();
  },
  serverError() {
    throw Boom.badImplementation('Internal Server Error');
  }
};
