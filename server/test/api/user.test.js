/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import { merge } from 'lodash';
import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import mongoose from 'mongoose';
import { apiV1, setup, teardown, resetDB } from '../testHelpers/testSetup';
import {
  cloudinaryPostMock,
  cloudinaryCleanup,
} from '../testHelpers/images/imageHelpers';
import app from '../../index';
import User from '../../api/user/userModel';

const { ObjectId } = mongoose.Types;

describe('/users', function() {
  let user;
  let createNewUser;
  let recipe;

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
  });
  after(teardown);
  afterEach(resetDB);

  describe('/', function() {
    describe('POST', function() {
      it('creates a new user', function() {
        return createNewUser.then(function(res) {
          expect(res.status).toBe(201);
          expect(res.body.statusCode).toBe(201);
          expect(res.body.data.token).toBeDefined();
        });
      });

      it('rejects a duplicate username', function() {
        return createNewUser.then(
          // Give a little time for the first user
          // to be created before the second attempt
          res =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve(function(res) {
                    return createNewUser.then(function(res) {
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
          .put(`${apiV1}/users`)
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
        const userUpdate = {
          snippet: faker.lorem.sentence(),
        };

        return createNewUser
          .then(function(res) {
            return request(app)
              .put(`${apiV1}/users`)
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
          .delete(`${apiV1}/users`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('deletes a user', function() {
        return createNewUser
          .then(function(res) {
            return request(app)
              .delete(`${apiV1}/users`)
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
          .get(`${apiV1}/users/me`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('returns the current user', function() {
        let createdUser;

        return createNewUser
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .get(`${apiV1}/users/me`)
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
        let createdUser;

        return createNewUser
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .get(`${apiV1}/users/${createdUser[0]._id}`)
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
          .get(`${apiV1}/users/${id}`)
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
          .get(`${apiV1}/users/${id}`)
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
        let createdUser;

        return createNewUser
          .then(async function(res) {
            createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
              .get(`${apiV1}/users/${createdUser[0]._id}/recipes`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.recipes)).toBeTruthy();
            expect(res.body.data.recipes).toHaveLength(1);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        return createNewUser
          .then(async function(res) {
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
          .then(async function(res) {
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
    });
  });

  describe('/:id/reviews', function() {
    describe('GET', function() {
      it('returns an array of reviews', function() {
        const review = {
          text: faker.lorem.paragraph(),
          rating: 3,
        };
        let token;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            expect(res.body.data.reviews).toHaveLength(1);
          });
      });
    });
  });

  describe('/:id/collections', function() {
    describe('GET', function() {
      it('needs jwt authorization', function() {
        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };
        let token;
        let userId;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };
        let token;
        let userId;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            expect(res.body.data.collections).toHaveLength(1);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };

        return createNewUser
          .then(async function(res) {
            const token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            const userId = res.body.data.user.id;
            const recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/users/${userId}/collections`)
              .send(merge(collection, { recipes: [recipeId] }))
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
        const collection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };
        let token;
        let recipeId;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            const userId = res.body.data.user.id;
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
        const collection = {
          name: faker.lorem.words(),
          isPrivate: false,
        };
        let token;
        let userId;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            expect(res.body.data.collections).toHaveLength(1);
          });
      });

      it('returns only public collections', function() {
        const publicCollection = {
          name: faker.lorem.words(),
          isPrivate: false,
        };
        const privateCollection = {
          name: faker.lorem.words(),
          isPrivate: true,
        };
        let token;
        let userId;
        let publicCollectionId;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({ username: user.username });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/recipes`)
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
            expect(res.body.data.collections).toHaveLength(1);
            expect(res.body.data.collections[0].id).toBe(publicCollectionId);
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

    describe('GET', function() {
      it('needs jwt authorization', function() {
        return createNewUser
          .then(async function(res) {
            const createdUser = await User.find({
              username: user.username,
            });

            return request(app)
              .get(`${apiV1}/users/${createdUser[0]._id}/images`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('returns an array of images', function() {
        const image = 'server/test/testHelpers/images/images/pinkPanther.jpg';
        let token;

        return createNewUser
          .then(async function(res) {
            token = res.body.data.token;
            const createdUser = await User.find({
              username: user.username,
            });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/images`)
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
            const userId = res.body.data.user.id;

            return request(app)
              .get(`${apiV1}/users/${userId}/images`)
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
            expect(Array.isArray(res.body.data.images)).toBeTruthy();
            expect(res.body.data.images).toHaveLength(1);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', function() {
        const image = 'server/test/testHelpers/images/images/pinkPanther.jpg';

        return createNewUser
          .then(async function(res) {
            const createdUser = await User.find({
              username: user.username,
            });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/images`)
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
        const image = 'server/test/testHelpers/images/images/pinkPanther.jpg';

        return createNewUser
          .then(async function(res) {
            const token = res.body.data.token;
            const createdUser = await User.find({
              username: user.username,
            });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/images`)
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
          });
      });

      it('rejects unauthorized file types', function() {
        // .gif
        const image = 'server/test/testHelpers/images/images/evilBaby.gif';

        return createNewUser
          .then(async function(res) {
            const token = res.body.data.token;
            const createdUser = await User.find({
              username: user.username,
            });

            return request(app)
              .post(`${apiV1}/users/${createdUser[0]._id}/images`)
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
});
