/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown, resetDB } from '../testHelpers/testSetup';
import {
  cloudinaryPostMock,
  cloudinaryCleanup,
} from '../testHelpers/images/imageHelpers';
import app from '../../index';

describe('/recipes', function() {
  let user;
  let recipe;
  let createNewUser;

  const createNewRecipe = () => ({
    name: faker.lorem.words(),
    snippet: faker.lorem.sentence(),
    ingredients: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
    directions: [
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
    ],
  });

  before(setup);
  beforeEach(() => {
    // Data is different for each test
    user = {
      username: faker.name.findName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      location: faker.address.city(),
      snippet: faker.lorem.sentence(),
      profileImage: faker.image.avatar(),
    };

    recipe = createNewRecipe();

    createNewUser = request(app)
      .post(`${apiV1}/users`)
      .send(user)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/);
  });
  after(teardown);
  afterEach(resetDB);

  describe('/', function() {
    describe('GET', function() {
      it('returns an array of all recipes', function() {
        const recipe1 = createNewRecipe();
        const recipe2 = createNewRecipe();
        const recipe3 = createNewRecipe();
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe1)
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
              .post(`${apiV1}/recipes`)
              .send(recipe2)
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
              .post(`${apiV1}/recipes`)
              .send(recipe3)
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
              .get(`${apiV1}/recipes`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(3);
            expect(res.body.data.groupLength).toBe(3);
            expect(res.body.data.recipes).toHaveLength(3);
            expect(res.body.data.recipes[0].name).toBe(recipe1.name);
            expect(res.body.data.recipes[1].name).toBe(recipe2.name);
            expect(res.body.data.recipes[2].name).toBe(recipe3.name);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds a recipe and updates the user', function() {
        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(recipe)
              .set(
                'Authorization',
                `Bearer ${res.body.data.token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.user.id).toBe(res.body.data.recipe.userId);
            expect(Array.isArray(res.body.data.user.recipes)).toBeTruthy();
            expect(res.body.data.user.recipes).toHaveLength(1);
            expect(res.body.data.user.recipes[0]).toBe(res.body.data.recipe.id);
          });
      });

      it('`name` is required', function() {
        // Remove `name` from recipe
        const { name, ...invalidRecipe } = recipe; // eslint-disable-line no-unused-vars

        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(invalidRecipe)
              .set(
                'Authorization',
                `Bearer ${res.body.data.token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`snippet` is required', function() {
        // Remove `snippet` from recipe
        const { snippet, ...invalidRecipe } = recipe; // eslint-disable-line no-unused-vars

        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(invalidRecipe)
              .set(
                'Authorization',
                `Bearer ${res.body.data.token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`ingredients` is required', function() {
        // Remove `ingredients` from recipe
        const { ingredients, ...invalidRecipe } = recipe; // eslint-disable-line no-unused-vars

        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(invalidRecipe)
              .set(
                'Authorization',
                `Bearer ${res.body.data.token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`directions` is required', function() {
        // Remove `directions` from recipe
        const { directions, ...invalidRecipe } = recipe; // eslint-disable-line no-unused-vars

        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/recipes`)
              .send(invalidRecipe)
              .set(
                'Authorization',
                `Bearer ${res.body.data.token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });
    });
  });

  describe('/:id', function() {
    describe('GET', function() {
      it('returns a recipe by ID', function() {
        let recipeId;

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .get(`${apiV1}/recipes/${recipeId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.recipe.id).toBe(recipeId);
          });
      });
    });

    describe('PUT', function() {
      it('needs jwt authorization', function() {
        let recipeId;
        const updatedRecipe = createNewRecipe();

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

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
            return request(app)
              .put(`${apiV1}/recipes/${recipeId}`)
              .send(updatedRecipe)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('updates a recipe', function() {
        const updatedRecipe = { name: faker.lorem.words() };
        let token;
        let recipeId;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .put(`${apiV1}/recipes/${recipeId}`)
              .send(updatedRecipe)
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
            expect(res.body.data.recipe.id).toBe(recipeId);
            expect(res.body.data.recipe.name).toBe(updatedRecipe.name);
            expect(res.body.data.recipe.snippet).toBe(recipe.snippet);
          });
      });
    });
  });

  describe('/:id/reviews', function() {
    let review;

    beforeEach(() => {
      review = { text: faker.lorem.paragraph(), rating: 3 };
    });

    describe('GET', function() {
      it('returns an array of reviews', function() {
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
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .get(`${apiV1}/recipes/${recipeId}/reviews`)
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

    describe('POST', function() {
      it('needs jwt authorization', function() {
        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds a review and updates the user and recipe', function() {
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.user.id).toBe(res.body.data.review.userId);
            expect(res.body.data.user.reviews[0]).toBe(res.body.data.review.id);
            expect(res.body.data.recipe.reviews[0]).toBe(
              res.body.data.review.id
            );
          });
      });

      it('`rating` is required', function() {
        const invalidReview = { text: faker.lorem.paragraph() };
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
              .send(invalidReview)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`rating` must be >= 1', function() {
        const invalidReview = {
          ...review,
          rating: 0,
        };
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
              .send(invalidReview)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`rating` must be <= 5', function() {
        const invalidReview = {
          ...review,
          rating: 11,
        };
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
              .send(invalidReview)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`text` is required', function() {
        const invalidReview = { rating: 3 };
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
              .send(invalidReview)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });
    });
  });

  describe('/:id/images', function() {
    // Mock cloudinaryPost for testing without hitting the API
    before(cloudinaryPostMock);
    // Clean up mock &
    // Delete temporary image files from server
    after(cloudinaryCleanup);

    let image = 'server/test/testHelpers/images/images/pinkPanther.jpg';

    describe('GET', function() {
      it('returns an array of images', function() {
        let token;
        let recipeId;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/images`)
              .attach('image', image)
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
              .get(`${apiV1}/recipes/${recipeId}/images`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.images)).toBeTruthy();
            expect(res.body.data.images).toHaveLength(1);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        let token;
        let recipeId;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/images`)
              .attach('image', image)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds an image and updates the user and recipe', function() {
        let token;
        let recipeId;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/images`)
              .attach('image', image)
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
            expect(res.body.data.user.id).toBe(res.body.data.image.userId);
            expect(Array.isArray(res.body.data.user.images)).toBeTruthy();
            expect(res.body.data.user.images).toHaveLength(1);
            expect(res.body.data.user.images[0]).toBe(res.body.data.image.id);
            expect(Array.isArray(res.body.data.recipe.images)).toBeTruthy();
            expect(res.body.data.recipe.images).toHaveLength(1);
            expect(res.body.data.recipe.images[0]).toBe(res.body.data.image.id);
          });
      });

      it('rejects unauthorized file types', function() {
        // .gif
        image = 'server/test/testHelpers/images/images/evilBaby.gif';
        let token;
        let recipeId;

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
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/recipes/${recipeId}/images`)
              .attach('image', image)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Bad File Type');
          });
      });
    });
  });

  describe('/:id/notes', function() {
    describe('GET', function() {});

    describe('POST', function() {});

    describe('PUT', function() {});

    describe('DELETE', function() {});
  });
});
