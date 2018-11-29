import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import mongoose from 'mongoose';
import { apiV1, setup, teardown, resetDB } from '../testSetup';
import app from '../../index';
import User from '../../api/user/userModel';

const { ObjectId } = mongoose.Types;

describe('User', () => {
  before(setup);
  after(teardown);
  afterEach(resetDB);

  describe('userGet', () => {
    it('returns a user by ID', done => {
      const user = {
        username: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        location: faker.address.city(),
        snippet: faker.lorem.sentence(),
        profileImage: faker.image.avatar(),
      };

      request(app)
        .post(`${apiV1}users`)
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(async res => {
          const userArray = await User.find({});

          request(app)
            .get(`${apiV1}users/${userArray[0]._id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .then(res => {  // eslint-disable-line
              expect(res.status).toBe(200);
              expect(res.body.statusCode).toBe(200);
              expect(ObjectId(res.body.data.user.id)).toBeTruthy();
              expect(res.body.data.user.id).toBe(String(userArray[0]._id));
              expect(res.body.data.user.username).toBe(user.username);
              expect(res.body.data.user.location).toBe(user.location);
              expect(res.body.data.user.snippet).toBe(user.snippet);
              expect(res.body.data.user.profileImage).toBe(user.profileImage);
              expect(Array.isArray(res.body.data.user.images)).toBeTruthy();
              expect(Array.isArray(res.body.data.user.recipes)).toBeTruthy();
              expect(
                Array.isArray(res.body.data.user.collections)
              ).toBeTruthy();
              expect(Array.isArray(res.body.data.user.reviews)).toBeTruthy();
              expect(Array.isArray(res.body.data.user.notes)).toBeTruthy();
              expect(res.body.data.user.createdAt).toBeDefined();
              expect(res.body.data.user.updatedAt).toBeDefined();
              expect(res.body.data.user.email).toBeUndefined();
              expect(res.body.data.user.password).toBeUndefined();
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });
  });

  describe('userPost', () => {
    it('creates a new user', done => {
      const user = {
        username: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      request(app)
        .post(`${apiV1}users`)
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.status).toBe(201);
          expect(res.body.statusCode).toBe(201);
          expect(res.body.data.token).toBeDefined();
          done();
        })
        .catch(err => done(err));
    });

    it('rejects a duplicate username', done => {
      const user = {
        username: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      request(app)
        .post(`${apiV1}users`)
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(res => {
          request(app)
            .post(`${apiV1}users`)
            .send(user)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .then(res => {  // eslint-disable-line
              expect(res.status).toBe(401);
              expect(res.body.statusCode).toBe(401);
              expect(res.body.message).toBe('Duplicate');
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });
  });

  describe('userPut', () => {
    it('needs jwt authorization', done => {
      const userUpdate = {
        snippet: faker.lorem.sentence(),
      };

      request(app)
        .put(`${apiV1}users`)
        .send(userUpdate)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.status).toBe(401);
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBe('Unauthorized');
          done();
        })
        .catch(err => done(err));
    });

    it('updates a user', done => {
      const user = {
        username: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const userUpdate = {
        snippet: faker.lorem.sentence(),
      };

      request(app)
        .post(`${apiV1}users`)
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(res => {
          request(app)
            .put(`${apiV1}users`)
            .send(userUpdate)
            .set(
              'Authorization',
              `Bearer ${res.body.data.token}`,
              'Accept',
              'application/json'
            )
            .expect('Content-Type', /json/)
            .then(res => {  // eslint-disable-line
              expect(res.status).toBe(200);
              expect(res.body.statusCode).toBe(200);
              expect(res.body.data.user.username).toBe(user.username);
              expect(res.body.data.user.snippet).toBe(userUpdate.snippet);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });
  });
});
