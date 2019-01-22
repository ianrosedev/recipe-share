/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown, resetDB } from '../../test/setup';
import app from '../../index';

describe('/reviews', function() {
  let createNewUser;
  let recipe;
  let review;

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

    recipe = {
      name: faker.lorem.words(),
      snippet: faker.lorem.sentence(),
      ingredients: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      directions: [
        faker.lorem.paragraph(),
        faker.lorem.paragraph(),
        faker.lorem.paragraph(),
      ],
    };

    review = {
      text: faker.lorem.paragraph(),
      rating: 3,
    };
  });
  after(teardown);
  afterEach(resetDB);

  describe('/', function() {
    describe('GET', function() {
      it('returns an array of all reviews', function() {
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
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
              .get(`${apiV1}/reviews`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.reviews)).toBeTruthy();
            expect(res.body.data.reviews).toHaveLength(1);
          });
      });
    });
  });

  describe('/:id', function() {
    describe('GET', function() {
      it('returns a review', function() {
        let token;
        let reviewId;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            reviewId = res.body.data.review.id;

            return request(app)
              .get(`${apiV1}/reviews/${reviewId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.review.id).toBe(reviewId);
          });
      });
    });

    describe('PUT', function() {
      const reviewUpdate = {
        rating: 5,
      };

      it('needs jwt authorization', function() {
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const reviewId = res.body.data.review.id;

            return request(app)
              .put(`${apiV1}/reviews/${reviewId}`)
              .send(reviewUpdate)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('updates a review', function() {
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const reviewId = res.body.data.review.id;

            return request(app)
              .put(`${apiV1}/reviews/${reviewId}`)
              .send(reviewUpdate)
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
            expect(res.body.data.text).toBe(review.text);
            expect(res.body.data.rating).toBe(reviewUpdate.rating);
          });
      });
    });

    describe('DELETE', function() {
      it('needs jwt authorization', function() {
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const reviewId = res.body.data.review.id;

            return request(app)
              .delete(`${apiV1}/reviews/${reviewId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('deletes a review', function() {
        let token;
        let reviewId;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/reviews`)
              .send(review)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            reviewId = res.body.data.review.id;

            return request(app)
              .delete(`${apiV1}/reviews/${reviewId}`)
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
            expect(res.body.data.review.id).toBe(reviewId);
            expect(res.body.data.user.reviews).toHaveLength(0);
            expect(res.body.data.recipe.reviews).toHaveLength(0);
          });
      });
    });
  });
});
