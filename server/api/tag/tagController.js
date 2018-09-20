import Tag from './tagModel';
import { findAndSort } from '../../helpers/query';
import pick from 'lodash.pick';

const tagGet = async (req, res, next) => {
  try {
    const tagId = req.params.id;
    const tag = await Tag
      .findById(tagId)
      .lean();

    if (!tag) {
      res.status(400).json({ message: 'Tag not found!' });
      return;
    }

    res.json({ tag });
  }
  catch (err) {
    next(err);
  }
};

const tagGetAll = async (req, res, next) => {
  try {
    // Make sure only permitted operations are sent to query
    const query = pick(
      req.query,
      'createdAt',
      'limit',
      'offset'
    );

    findAndSort(req, res, next, {
      model: Tag,
      as: 'tags',
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const tagPost = async (req, res, next) => {
  try {
    const newTag = new Tag(req.body);
    const createdTag = await newTag.save();

    if (!createdTag) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ tag: createdTag });
  }
  catch (err) {
    next(err);
  }
};

export default {
  tagGet,
  tagGetAll,
  tagPost
};
