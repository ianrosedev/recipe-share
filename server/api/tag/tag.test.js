/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown, resetDB } from '../../test/setup';
import app from '../../index';

describe('/tags', function() {
  let createNewUser;
  let tag;

  before(setup);
  beforeEach(() => {
    // Data is different for each test
    const user = {
      username: faker.name.findName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      location: faker.address.city(),
      snippet: faker.lorem.sentence(),
      profileImage: faker.image.avatar(),
    };

    createNewUser = request(app)
      .post(`${apiV1}/users`)
      .send(user)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/);

    tag = {
      name: faker.lorem.word(),
    };
  });
  after(teardown);
  afterEach(resetDB);

  describe('/', function() {
    describe('GET', function() {
      it('returns an array of all tags', function() {
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/tags`)
              .send(tag)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            return request(app)
              .get(`${apiV1}/tags`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.tags)).toBeTruthy();
            expect(res.body.data.tags).toHaveLength(1);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        request(app)
          .post(`${apiV1}/tags`)
          .send(tag)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds a tag', function() {
        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/tags`)
              .send(tag)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.tag.name).toBe(tag.name);
          });
      });
    });
  });

  describe('/:id', function() {
    it('returns a tag by ID', function() {
      return createNewUser
        .then(function(res) {
          const token = res.body.data.token;

          return request(app)
            .post(`${apiV1}/tags`)
            .send(tag)
            .set(
              'Authorization',
              `Bearer ${token}`,
              'Accept',
              'application/json'
            )
            .expect('Content-Type', /json/);
        })
        .then(function(res) {
          const tagId = res.body.data.tag.id;

          return request(app)
            .get(`${apiV1}/tags/${tagId}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        })
        .then(function(res) {
          expect(res.status).toBe(200);
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data.tag.name).toBe(tag.name);
        });
    });
  });
});
