import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown } from '../testSetup';
import app from '../../index';

describe('User', () => {
  before(setup);
  after(teardown);

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
          expect(res.statusCode).toBe(201);
          expect(res.body.statusCode).toBe(201);
          expect(res.body.data.token).toBeTruthy();
          done();
        })
        .catch(err => done(err));
    });

    it('rejects a duplicate name', done => {
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
              expect(res.statusCode).toBe(401);
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
        username: faker.name.findName(),
        snippet: faker.lorem.sentence(),
      };

      request(app)
        .put(`${apiV1}users`)
        .send(userUpdate)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.statusCode).toBe(401);
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
        username: faker.name.findName(),
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
              expect(res.statusCode).toBe(200);
              expect(res.body.statusCode).toBe(200);
              expect(res.body.data.user.username).toBe(userUpdate.username);
              expect(res.body.data.user.snippet).toBe(userUpdate.snippet);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });
  });
});
