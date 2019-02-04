import mongoose from 'mongoose';
import Note from './noteModel';
import User from '../user/userModel';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';

const { ObjectId } = mongoose.Types;

const noteGet = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const notes = await Note.findOne({ userId, recipeId });

  if (!notes) {
    dataResponse({ notes: null });
  }

  res.json(dataResponse({ notes }));
});

const notePost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const existingNotes = await Note.findOne({ userId, recipeId });

  if (existingNotes) {
    errorResponse.customBadRequest('Notes already exist');
  }

  const noteWithAuthor = {
    ...req.body,
    userId: new ObjectId(userId),
    recipeId: new ObjectId(recipeId),
  };
  const newNote = new Note(noteWithAuthor);
  const createdNote = await newNote.save();

  if (!createdNote) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { notes: createdNote._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({ user: updatedUser, notes: createdNote }));
});

const notePut = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const notes = await Note.findOneAndUpdate(
    { userId, recipeId },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!notes) {
    errorResponse.customBadRequest("Notes don't exist");
  }

  res.json(dataResponse({ notes }));
});

const noteDelete = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const destroyedNotes = await Note.findOneAndDelete({ userId, recipeId });

  if (!destroyedNotes) {
    errorResponse.customBadRequest("Notes don't exist");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { notes: destroyedNotes._id } },
    { new: true }
  );

  res.json(
    dataResponse({
      user: updatedUser,
      notes: destroyedNotes._id,
    })
  );
});

export default {
  noteGet,
  notePost,
  notePut,
  noteDelete,
};
