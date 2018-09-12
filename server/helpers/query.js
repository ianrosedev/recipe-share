export const populateAndSort = async (req, res, next, options = {}) => {
  try {
    // Options: model, path, id, query { createdAt, rating, stars }
    // Required: model, path, id
    const model = options.model;
    const path = options.path;
    const id = options.id || req.params.id;
    const query = options.query || req.query;
    const populateOptions = { path };

    // Check for required options
    if (!model) {
      throw new Error('Server Error: `option: model` is required!');
    }

    if (!path) {
      throw new Error('Server Error: `option: path` is required!');
    }

    if (!id) {
      throw new Error('Server Error: `option: id` is required');
    }

    // Build population options
    if (query.rating) {
      populateOptions.options = {
        sort: {
          rating: query.rating
        }
      };
    }

    if (query.createdAt) {
      if (query.rating) {
        populateOptions.options.sort.createdAt = query.createdAt;
      } else {
        populateOptions.options = {
          sort: {
            createdAt: query.createdAt
          }
        };
      }
    }

    // Find by individual rating
    if (query.stars) {
      populateOptions.match = {
        rating: query.stars
      };
    }

    // Get data from database
    // Handle error from database?
    const populated = await model
      .findById(id)
      .select(`-_id ${path}`)
      .populate(populateOptions)
      .lean();

    // Check that id was found
    if (!populated) {
      res.status(400).json({ message: 'Incorrect id!' });
      return;
    }

    // Check for pagination params
    // If none send response
    if (!query.offset && !query.limit) {
      res.json({
        length: await populated[path].length,
        groupLength: await populated[path].length,
        [path]: await populated[path]
      });
      return;
    }

    // Build pagination
    // Ckeck that it is in bounds and respond
    const offset = Number(query.offset) || 0;
    const limit = (Number(query.limit) || 10) + (offset || 0);

    if (offset >= await populated[path].length) {
      res.status(400).json({ message: 'Limit is out of bounds!' });
      return;
    }

    const paginatedPopulated = await populated[path].slice(offset, limit);

    res.json({
      length: await populated[path].length,
      groupLength: await paginatedPopulated.length,
      [path]: await paginatedPopulated
    });
  }
  catch (err) {
    next(err);
  }
};
