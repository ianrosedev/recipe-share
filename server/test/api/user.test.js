/* eslint-disable prefer-arrow-callback, no-shadow */
// Always use standard function declaration for mocha
// Allow use of same paramater name nested

import { merge } from 'lodash';
import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import mongoose from 'mongoose';
import { apiV1, setup, teardown, resetDB } from '../testHelpers/testSetup';
import { cloudinaryPostMock } from '../testHelpers/images/imageMocks';
import app from '../../index';
import User from '../../api/user/userModel';

const { ObjectId } = mongoose.Types;

describe('/users', function() {
  before(setup);
  after(teardown);
  afterEach(resetDB);

  describe('/', function() {
    describe('POST', function() {
      it('creates a new user', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(201);
            expect(res.body.statusCode).toBe(201);
            expect(res.body.data.token).toBeDefined();
          });
      });

      it('rejects a duplicate username', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(
            // Give a little time for the first user
            // to be created before the second attempt
            res =>
              new Promise(resolve =>
                setTimeout(
                  () =>
                    resolve(function(res) {
                      return request(app)
                        .post(`${apiV1}users`)
                        .send(user)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .then(function(res) {
                          expect(res.status).toBe(401);
                          expect(res.body.statusCode).toBe(401);
                          expect(res.body.message).toBe('Duplicate');
                        });
                    }),
                  10
                )
              )
          );
      });
    });

    describe('PUT', function() {
      it('needs jwt authorization', function() {
        const userUpdate = {
          snippet: faker.lorem.sentence(),
        };

        return request(app)
          .put(`${apiV1}users`)
          .send(userUpdate)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('updates a user', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const userUpdate = {
          snippet: faker.lorem.sentence(),
        };

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            return request(app)
              .put(`${apiV1}users`)
              .send(userUpdate)
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
            expect(res.body.data.user.username).toBe(user.username);
            expect(res.body.data.user.snippet).toBe(userUpdate.snippet);
          });
      });
    });

    describe('DELETE', function() {
      it('needs jwt authorization', function() {
        return request(app)
          .delete(`${apiV1}users`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('deletes a user', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            return request(app)
              .delete(`${apiV1}users`)
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
            expect(res.body.data.destroyed).toBeTruthy();
          });
      });
    });
  });

  describe('/me', function() {
    describe('GET', function() {
      it('needs jwt authorization', function() {
        return request(app)
          .get(`${apiV1}users/me`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('returns the current user', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .get(`${apiV1}users/me`)
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
            expect(res.body.data.user.id).toBe(String(createdUser[0]._id));
            expect(res.body.data.user.username).toBe(user.username);
          });
      });
    });
  });

  describe('/:id', function() {
    describe('GET', function() {
      it('returns a user by ID', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          location: faker.address.city(),
          snippet: faker.lorem.sentence(),
          profileImage: faker.image.avatar(),
        };

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .get(`${apiV1}users/${createdUser[0]._id}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(ObjectId(res.body.data.user.id)).toBeTruthy();
            expect(res.body.data.user.id).toBe(String(createdUser[0]._id));
            expect(res.body.data.user.username).toBe(user.username);
            expect(res.body.data.user.location).toBe(user.location);
            expect(res.body.data.user.snippet).toBe(user.snippet);
            expect(res.body.data.user.profileImage).toBe(user.profileImage);
            expect(Array.isArray(res.body.data.user.images)).toBeTruthy();
            expect(Array.isArray(res.body.data.user.recipes)).toBeTruthy();
            expect(Array.isArray(res.body.data.user.collections)).toBeTruthy();
            expect(Array.isArray(res.body.data.user.reviews)).toBeTruthy();
            expect(Array.isArray(res.body.data.user.notes)).toBeTruthy();
            expect(res.body.data.user.createdAt).toBeDefined();
            expect(res.body.data.user.updatedAt).toBeDefined();
            expect(res.body.data.user.email).toBeUndefined();
            expect(res.body.data.user.password).toBeUndefined();
          });
      });

      it('returns 400 for invalid ID type', function() {
        const id = 'Spaceballs1234';

        return request(app)
          .get(`${apiV1}users/${id}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid ID');
          });
      });

      it('returns 400 if user not found', function() {
        const id = '5b6b22cfd5507aaeafdb65a3';

        return request(app)
          .get(`${apiV1}users/${id}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('No user with that ID');
          });
      });
    });
  });

  describe('/:id/recipes', function() {
    describe('GET', function() {
      it('returns an array of recipes', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            return request(app)
              .get(`${apiV1}users/${createdUser[0]._id}/recipes`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.recipes)).toBeTruthy();
          });
      });

      it('returns 400 for invalid ID type', function() {
        const id = 'Spaceballs1234';

        return request(app)
          .get(`${apiV1}users/${id}/reviews`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid ID');
          });
      });

      it('returns 400 if user not found', function() {
        const id = '5b6b22cfd5507aaeafdb65a3';

        return request(app)
          .get(`${apiV1}users/${id}/reviews`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Bad Request');
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            expect(res.body.data.user.recipes[0]).toBe(res.body.data.recipe.id);
          });
      });
    });
  });

  describe('/:id/reviews', function() {
    describe('GET', function() {
      it('returns an array of reviews', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const review = {
          text: faker.lorem.paragraph(),
          rating: 3,
        };

        let token;
        let createdUser;
        let recipeId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            const userId = res.body.data.user.id;

            return request(app)
              .get(`${apiV1}/users/${userId}/reviews`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.reviews)).toBeTruthy();
          });
      });

      it('returns 400 for invalid ID type', function() {
        const id = 'Spaceballs1234';

        return request(app)
          .get(`${apiV1}users/${id}/reviews`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid ID');
          });
      });

      it('returns 400 if user not found', function() {
        const id = '5b6b22cfd5507aaeafdb65a3';

        return request(app)
          .get(`${apiV1}users/${id}/reviews`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe('Bad Request');
          });
      });
    });
  });

  describe('/:id/collections', function() {
    describe('GET', function() {
      it('needs jwt authorization', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        let token;
        let createdUser;
        let userId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(collection)
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
              .get(`${apiV1}/users/${userId}/collections`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('returns an array of collections', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        let token;
        let createdUser;
        let userId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(collection)
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
              .get(`${apiV1}/users/${userId}/collections`)
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
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.collections)).toBeTruthy();
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        let token;
        let createdUser;
        let userId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(collection)
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
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        let token;
        let createdUser;
        let userId;
        let recipeId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(merge(collection, { recipes: [recipeId] }))
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
            expect(res.body.data.user.id).toBe(res.body.data.collection.userId);
            expect(res.body.data.user.collections[0]).toBe(
              res.body.data.collection.id
            );
            expect(res.body.data.collection.recipes[0]).toBe(recipeId);
          });
      });
    });
  });

  describe('/:id/collections/public', function() {
    describe('GET', function() {
      it('returns an array of collections', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const collection = {
          name: faker.lorem.words(),
          isPrivate: false,
        };

        let token;
        let createdUser;
        let userId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(collection)
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
              .get(`${apiV1}/users/${userId}/collections/public`)
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
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.collections)).toBeTruthy();
          });
      });

      it('returns only public collections', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };

        const recipe = {
          name: faker.lorem.words(),
          snippet: faker.lorem.sentence(),
          ingredients: [
            faker.lorem.word(),
            faker.lorem.word(),
            faker.lorem.word(),
          ],
          directions: [
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
            faker.lorem.paragraph(),
          ],
        };

        const publicCollection = {
          name: faker.lorem.words(),
          isPrivate: false,
        };

        const privateCollection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        let token;
        let createdUser;
        let userId;
        let publicCollectionId;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/recipes`)
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
            userId = res.body.data.user.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(publicCollection)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            publicCollectionId = res.body.data.collection.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(privateCollection)
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
              .get(`${apiV1}/users/${userId}/collections/public`)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(async function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.collections)).toBeTruthy();
            expect(res.body.data.collections[0].id).toBe(publicCollectionId);
          });
      });
    });
  });

  describe('/:id/images', function() {
    // Mock cloudinaryPost for testing
    // without hitting the API
    cloudinaryPostMock();

    describe('GET', function() {});
    describe('POST', function() {
      it('needs jwt authorization', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };
        const image = 'server/test/testHelpers/images/pinkPanther.jpg';

        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/images`)
              .attach('image', image)
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds an image and updates the user', function() {
        const user = {
          username: faker.name.findName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        };
        const image = 'server/test/testHelpers/images/pinkPanther.jpg';

        let token;
        let createdUser;

        return request(app)
          .post(`${apiV1}users`)
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(async function(res) {
            token = res.body.data.token; // eslint-disable-line
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}users/${createdUser[0]._id}/images`)
              .attach('image', image)
              .set('Authorization', `Bearer ${token}`)
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.user.id).toBe(res.body.data.image.userId);
            expect(Array.isArray(res.body.data.user.images)).toBeTruthy();
            expect(res.body.data.user.images[0]).toBe(res.body.data.image.id);
          });
      });
    });
  });
});
