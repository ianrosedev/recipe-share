import request from 'supertest';
import expect from 'expect';
import mongoose from 'mongoose';
import app from '../index';

describe('review', done => {
  afterEach(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
  });

  it('works at all', () => {
    request(app)
      .get('/api/v1/review')
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      })
      .catch(err => {
        throw new Error(err);
      });
  });
});
