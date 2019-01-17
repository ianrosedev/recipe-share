import { pick, startCase } from 'lodash';
import Tag from '../api/tag/tagModel';
import { errorResponse } from './error';
import { dataResponse } from './response';

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
    offset,
  } = allowedQueries;

  if (tags && !tags.split(',').every(value => /^[\w\s]+$/.test(value))) {
    return false;
  }

  if (inc && !inc.split(',').every(value => /^[\w\s]+$/.test(value))) {
    return false;
  }

  if (notInc && !notInc.split(',').every(value => /^[\w\s]+$/.test(value))) {
    return false;
  }

  if (createdAt && !/asc|desc/.test(createdAt)) {
    return false;
  }

  if (rating && !/asc|desc/.test(rating)) {
    return false;
  }

  if (stars && !/^[1-5]$/.test(stars)) {
    return false;
  }

  if (limit && !/^\d+$/.test(limit)) {
    return false;
  }

  if (offset && !/^\d+$/.test(offset)) {
    return false;
  }

  return allowedQueries;
};

// Helper for findAndSort
// Exported for tesing only
export const queryFind = async (model, options) => {
  /**
   * Params: model, options
   *
   * Options: {
   *   match: {
   *    stars: 1-5,
   *    tags: 'strings',
   *    inc: 'strings',
   *    notInc: 'strings',
   *   },
   *   sort : {
   *    createdAt: 'asc' || 'desc',
   *    rating: 'asc' || 'desc'
   *   }
   * }
   *
   * Required: model
   * */
  try {
    if (!model) {
      throw new TypeError('`model` is required');
    }

    const { sort, match } = options;
    const results = await model.find(match).sort(sort);

    return results;
  } catch (err) {
    throw err;
  }
};

// Helper for findAndSort
// Exported for tesing only
export const queryFindAndPopulate = async (model, id, path, options = {}) => {
  /**
   * Params: model, id, path, options
   *
   * Options: {
   *   match: {
   *    stars: 1-5,
   *    tags: 'strings',
   *    inc: 'strings',
   *    notInc: 'strings',
   *   },
   *   sort : {
   *    createdAt: 'asc' || 'desc',
   *    rating: 'asc' || 'desc'
   *   }
   * }
   *
   * Required: model, id, path
   * */
  try {
    if (!model) {
      throw new TypeError('`model` is required');
    }

    if (!id) {
      throw new TypeError('`id` is required');
    }

    if (!path) {
      throw new TypeError('`path` is required');
    }

    const results = await model
      .findById(id)
      .select(`${path}`)
      .populate({
        path,
        match: options.match,
        options: {
          sort: options.sort,
        },
      });

    // Set results to correct path
    return results[path];
  } catch (err) {
    throw err;
  }
};

// Helper for findAndSort
// Exported for tesing only
export const queryPaginate = (data, offset = 0, limit = 20) => {
  /**
   * Params: data, offset, limit
   *
   * Required: data
   * */
  try {
    if (!data) {
      throw new TypeError('`data` is required');
    }

    offset = Number(offset);
    limit = Number(limit) + offset;

    // If offset is out of bounds
    // return null so error can be sent
    if (data.length > 0 && data.length <= offset) {
      return null;
    }

    return data.slice(offset, limit);
  } catch (err) {
    throw err;
  }
};

export const findAndSort = async (
  req,
  res,
  next,
  { model, id, path, as, query = {}, filter }
) => {
  /**
   * Params: req, res, next, options
   *
   * Options: {
   *   model,
   *   path,
   *   as,
   *   id,
   *   query {
   *     createdAt: 'asc' || 'desc',
   *     rating: 'asc' || 'desc',
   *     stars: 1-5,
   *     tags: 'strings',
   *     inc: 'strings',
   *     notInc: 'strings',
   *     filter: function
   *   }
   * }
   *
   * Required: req, res, next, options.model
   * */
  try {
    // Check for required params
    if (!model) {
      throw new Error('`model` is required');
    }

    // Build query options
    const queryOptions = {};

    if (query.rating || query.createdAt) {
      queryOptions.sort = {};

      if (query.rating) {
        queryOptions.sort.rating = query.rating;
      }

      if (query.createdAt) {
        queryOptions.sort.createdAt = query.createdAt;
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
        const tagIds = await foundTags.map(tag => tag._id);
        queryOptions.match.tags = { $all: tagIds };
      }

      if (query.inc || query.notInc) {
        queryOptions.match.ingredients = {};

        if (query.inc) {
          const inc = query.inc
            .split(',')
            .map(ingredient => startCase(ingredient.trim()));
          queryOptions.match.ingredients.$all = inc;
        }

        if (query.notInc) {
          const notInc = query.notInc
            .split(',')
            .map(ingredient => startCase(ingredient.trim()));
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
      results = await queryFindAndPopulate(model, id, path, queryOptions);
    }

    // Check that result was found
    if (!results) {
      errorResponse.customBadRequest();
    }

    // Filter results if option is present
    if (filter) {
      results = results.filter(filter);
    }

    // Check for pagination params
    // If none send response
    if (!query.offset && !query.limit) {
      res.json(
        dataResponse({
          length: results.length,
          groupLength: results.length,
          [as || path]: results,
        })
      );
      return;
    }

    // Paginate
    const paginatedResults = queryPaginate(results, query.offset, query.limit);

    // If queryPaginate responds with error
    if (!paginatedResults) {
      errorResponse.customBadRequest('Offset out of bounds');
    }

    // Paginated response
    res.json(
      dataResponse({
        length: results.length,
        groupLength: paginatedResults.length,
        [as || path]: paginatedResults,
      })
    );
  } catch (err) {
    next(err);
  }
};
