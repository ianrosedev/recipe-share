import Tag from '../api/tag/tagModel';
import { errorResponse } from '../helpers/error';
import { dataResponse } from '../helpers/response';
import { pick, startCase } from 'lodash';

export const validateQuery = (query, allowedParams) => {
  const allowedQueries = pick(query, ...allowedParams);
  const {
    tags,
    inc,
    notInc,
    createdAt,
    rating,
    stars,
    limit,
    offset
  } = allowedQueries;

  if (tags && !tags.split(',').every(value => (/^[\w\s]+$/).test(value))) {
    return false;
  }

  if (inc && !inc.split(',').every(value => (/^[\w\s]+$/).test(value))) {
    return false;
  }

  if (notInc && !notInc.split(',').every(value => (/^[\w\s]+$/).test(value))) {
    return false;
  }

  if (createdAt && !(/asc|desc/).test(createdAt)) {
    return false;
  }

  if (rating && !(/asc|desc/).test(rating)) {
    return false;
  }

  if (stars && !(/^[1-5]$/).test(stars)) {
    return false;
  }

  if (limit && !(/^\d+$/).test(limit)) {
    return false;
  }

  if (offset && !(/^\d+$/).test(offset)) {
    return false;
  }

  return allowedQueries;
};

const queryFind = async (model, options) => {
  /**
    * Params: model, options
    *
    * Options: {
    *   createdAt: 'asc' || 'desc',
    *   rating: 'asc' || 'desc',
    *   stars: 1-5
    * }
    *
    * Required: model
  **/
  try {
    const sort = options.options ? options.options.sort : {};
    const match = options.match || {};

    // Check for required options
    if (!model) {
      throw new TypeError('`option: model` is required');
    }

    // Get data from database
    // Handle error from database?
    const results = await model
      .find(match)
      .sort(sort)
      .lean();

    return results;
  }
  catch (err) {
    throw new Error(err);
  }
};

const queryFindAndPopulate = async (model, id, options = {}) => {
  /**
    * Params: model, id, options
    *
    * Options: {
    *   path: path,
    *   createdAt: 'asc' || 'desc',
    *   rating: 'asc' || 'desc',
    *   stars: 1-5
    * }
    *
    * Required: model, id, options.path
  **/
  try {
    const path = options.path;

    // Check for required options
    if (!model) {
      throw new TypeError('`option: model` is required');
    }

    if (!id) {
      throw new TypeError('`option: id` is required');
    }

    if (!path) {
      throw new TypeError('`option: path` is required');
    }

    // Get data from database
    const results = await model
      .findById(id)
      .select(`-_id ${path}`)
      .populate(options)
      .lean();

    if (!results) {
      throw new Error('Internal Server Error');
    }

    return results;
  }
  catch (err) {
    throw new Error(err);
  }
};

const queryPaginate = (res, data, offset = 0, limit = 20) => {
  /**
  * Params: res, data, offset, limit
  *
  * Required: res, data
  **/
  try {
    offset = Number(offset);
    limit = Number(limit) + offset;

    if (data.length > 0 && data.length <= offset) {
      res.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Offset out of bounds'
      });
      return;
    }

    return data.slice(offset, limit);
  }
  catch (err) {
    throw new Error(err);
  }
};

export const findAndSort = async (req, res, next, {
  model,
  id,
  path,
  as,
  query,
  filter
}) => {
  /**
    * Params: req, res, next, options
    *
    * Options: {
    *   model,
    *   path,
    *   id,
    *   query {
    *     createdAt: 'asc' || 'desc',
    *     rating: 'asc' || 'desc',
    *     stars: 1-5,
    *     filter: function
    *   }
    * }
    *
    * Required: req, res, next, options.model
  **/
  try {
    const queryOptions = path ? { path } : {};

    // Check for required options
    if (!model) {
      throw new Error('`option: model` is required');
    }

    // Build query options
    if (query.rating || query.createdAt) {
      queryOptions.options = { sort: {} };

      if (query.rating) {
        queryOptions.options.sort.rating = query.rating;
      }

      if (query.createdAt) {
        queryOptions.options.sort.createdAt = query.createdAt;
      }
    }

    if (query.stars || query.tags || query.inc || query.notInc) {
      queryOptions.match = {};

      if (query.stars) {
        queryOptions.match.rating = query.stars;
      }

      if (query.tags) {
        const tags = query.tags.split(',').map(tag => startCase(tag.trim()));
        const foundTags = await Tag.find({ name: tags });
        const tagIds = await foundTags.map(tag => tag._id)
        queryOptions.match.tags = { $all: tagIds };
      }

      if (query.inc || query.notInc) {
        queryOptions.match.ingredients = {};

        if (query.inc) {
          const inc = query.inc.split(',').map(
            ingredient => startCase(ingredient.trim())
          );
          queryOptions.match.ingredients.$all = inc;
        }

        if (query.notInc) {
          const notInc = query.notInc.split(',').map(
            ingredient => startCase(ingredient.trim())
          );
          queryOptions.match.ingredients.$nin = notInc;
        }
      }
    }

    // Get reults from database
    let results;

    if (!path && !id) {
      // Find query
      results = await queryFind(model, queryOptions);
    } else {
      // Find nested query
      results = await queryFindAndPopulate(model, id, queryOptions);
    }

    // Check that result was found
    if (!results) {
      errorResponse.customBadRequest();
    }

    // Set results to correct path
    results = results[path] || results;

    // Filter results if option is present
    if (filter) {
      results = results.filter(filter);
    }

    // Check for pagination params
    // If none send response
    if (!query.offset && !query.limit) {
      res.json(dataResponse({
        length: results.length,
        groupLength: results.length,
        [as || path]: results
      }));
      return;
    }

    // Paginate and send response
    const paginatedResults = queryPaginate(
      res,
      results,
      query.offset,
      query.limit
    );

    // Return if queryPaginate responds to error
    if (!paginatedResults) {
      return;
    }

    res.json(dataResponse({
      length: results.length,
      groupLength: paginatedResults.length,
      [as || path]: paginatedResults
    }));
  }
  catch (err) {
    next(err);
  }
};
