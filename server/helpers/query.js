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
      throw new Error('Server Error: `option: model` is required!');
    }

    // Get data from database
    // Handle error from database?
    const results = await model
      .find(match)
      .sort(sort)
      .lean();

    return await results;
  }
  catch (err) {
    throw new Error(err);
  }
};

const queryFindAndPopulate = async (model, id, options) => {
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
      throw new Error('Server Error: `option: model` is required!');
    }

    if (!id) {
      throw new Error('Server Error: `option: id` is required');
    }

    if (!path) {
      throw new Error('Server Error: `option: path` is required!');
    }

    // Get data from database
    // Handle error from database?
    const results = await model
      .findById(id)
      .select(`-_id ${path}`)
      .populate(options)
      .lean();

    return await results;
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

    if (offset >= data.length) {
      res.status(400).json({ message: 'Limit is out of bounds!' });
      return;
    }

    return data.slice(offset, limit);
  }
  catch (err) {
    throw new Error(err);
  }
};

export const findAndSort = async (req, res, next, options = {}) => {
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
    const model = options.model;
    const path = options.path;
    const id = options.id;
    const as = options.as;
    const query = options.query;
    const filter = options.filter;
    const queryOptions = path ? { path } : {};

    // Check for required options
    if (!model) {
      throw new Error('Server Error: `option: model` is required!');
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

    if (query.stars) {
      queryOptions.match = {
        rating: query.stars
      };
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
      res.status(400).json({ message: 'Bad request!' });
      return;
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
      res.json({
        length: await results.length,
        groupLength: await results.length,
        [path || as]: await results
      });
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

    res.json({
      length: await results.length,
      groupLength: await paginatedResults.length,
      [path || as]: await paginatedResults
    });
  }
  catch (err) {
    next(err);
  }
};
