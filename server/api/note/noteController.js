import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Note from './noteModel';
import User from '../user/userModel';
import { merge } from 'lodash';

const noteGet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const notes = await Note.findOne({ userId, recipeId });

    if (!notes) {
      res.status(400).json({ message: 'No notes for that recipe!' });
      return;
    }

    res.json({ notes });
  }
  catch (err) {
    next(err);
  }
};

const notePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const existingNotes = await Note.findOne({ userId, recipeId });

    if (existingNotes) {
      res.status(400).json({ message: 'Notes alredy exist for that recipe!' });
      return;
    }

    const noteWithAuthor = merge(
      req.body,
      { userId: new ObjectId(userId) },
      { recipeId: new ObjectId(recipeId) }
    );
    const newNote = new Note(noteWithAuthor);
    const createdNote = await newNote.save();

    if (!createdNote) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { notes: createdNote._id } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ user: updatedUser, notes: createdNote });
  }
  catch (err) {
    next(err);
  }
};

const notePut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const notes = await Note.findOneAndUpdate(
      { userId, recipeId },
      { $set: req.body },
      { new: true }
    );

    if (!notes) {
      res.status(400).json({ message: 'No notes for that recipe!' });
      return;
    }

    res.json({ notes });
  }
  catch (err) {
    next(err);
  }
};

const noteDelete = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const destroyedNotes = await Note.findOneAndDelete({ userId, recipeId });

    if (!destroyedNotes) {
      res.status(400).json({ message: 'No notes for this recipe' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { notes: destroyedNotes._id } },
      { new: true }
    );

    res.json({ user: updatedUser, notes: destroyedNotes._id });
  }
  catch (err) {
    next(err);
  }
};

export default {
  noteGet,
  notePost,
  notePut,
  noteDelete
};
