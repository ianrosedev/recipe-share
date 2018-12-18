import Tag from './tagModel';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { validateQuery, findAndSort } from '../../helpers/query';

const tagGet = asyncMiddleware(async (req, res, next) => {
  const tagId = req.params.id;
  const tag = await Tag.findById(tagId);

  if (!tag) {
    errorResponse.searchNotFound('tag');
  }

  res.json(dataResponse({ tag }));
});

const tagGetAll = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, ['createdAt', 'limit', 'offset']);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: Tag,
    as: 'tags',
    query,
  });
});

const tagPost = asyncMiddleware(async (req, res, next) => {
  const newTag = new Tag(req.body);
  const createdTag = await newTag.save();

  res.json(dataResponse({ tag: createdTag }));
});

export default {
  tagGet,
  tagGetAll,
  tagPost,
};
