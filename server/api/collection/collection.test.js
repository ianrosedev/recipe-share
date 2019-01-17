/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown, resetDB } from '../../test/setup';
import app from '../../index';
import Collection from './collectionModel';

describe('/collections', function() {
  let createNewUser;
  let createNewRecipeId;

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

    createNewRecipeId = () => {
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
          return res.body.data.recipe.id;
        });
    };
  });
  after(teardown);
  afterEach(async () => {
    await Collection.deleteMany({});
    await resetDB();
  });

  describe('/', function() {
    describe('GET', function() {
      it('returns an array of all collections', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const recipe3 = await createNewRecipeId();
        const collection1 = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collection2 = {
          name: faker.lorem.words(),
          recipes: [recipe2, recipe3],
          isPrivate: false,
        };
        let collection1Id;
        let collection2Id;
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collection1)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            collection1Id = res.body.data.collection.id;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collection2)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            collection2Id = res.body.data.collection.id;

            return request(app)
              .get(`${apiV1}/collections`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(2);
            expect(res.body.data.groupLength).toBe(2);
            expect(Array.isArray(res.body.data.collections)).toBeTruthy();
            expect(res.body.data.collections).toHaveLength(2);
            expect(res.body.data.collections[0].id).toBe(collection1Id);
            expect(res.body.data.collections[1].id).toBe(collection2Id);
          });
      });

      it('returns only public collections', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const recipe3 = await createNewRecipeId();
        const collection1 = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collection2 = {
          name: faker.lorem.words(),
          recipes: [recipe2, recipe3],
          isPrivate: true,
        };
        let collection1Id;
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collection1)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            collection1Id = res.body.data.collection.id;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collection2)
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
              .get(`${apiV1}/collections`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data.groupLength).toBe(1);
            expect(Array.isArray(res.body.data.collections)).toBeTruthy();
            expect(res.body.data.collections).toHaveLength(1);
            expect(res.body.data.collections[0].id).toBe(collection1Id);
          });
      });
    });

    describe('POST', function() {
      it('needs jwt authorization', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            return request(app)
              .post(`${apiV1}/collections`)
              .send(collection)
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

      it('creates a new collection and updates the user', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.userId).toBe(res.body.data.user.id);
            expect(res.body.data.user.collections[0]).toBe(
              res.body.data.collection.id
            );
          });
      });

      it('accepts an array with no recipes', async function() {
        const collection = {
          name: faker.lorem.words(),
          recipes: [],
          isPrivate: false,
        };
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.userId).toBe(res.body.data.user.id);
            expect(res.body.data.user.collections[0]).toBe(
              res.body.data.collection.id
            );
            expect(
              Array.isArray(res.body.data.collection.recipes)
            ).toBeTruthy();
            expect(res.body.data.collection.recipes).toHaveLength(0);
          });
      });

      it('`name` defaults to `My Collection`', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.name).toBe('My Collection');
          });
      });

      it('`name` must be at least 1 letter`', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: '',
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(400);
            expect(res.body.statusCode).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toBe('Invalid Value For Required Field');
          });
      });

      it('`recipes` is not required', async function() {
        const collection = {
          name: faker.lorem.words(),
          isPrivate: false,
        };
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.userId).toBe(res.body.data.user.id);
            expect(res.body.data.user.collections[0]).toBe(
              res.body.data.collection.id
            );
            expect(
              Array.isArray(res.body.data.collection.recipes)
            ).toBeTruthy();
            expect(res.body.data.collection.recipes).toHaveLength(0);
          });
      });

      it('`isPrivate` defaults to true', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.userId).toBe(res.body.data.user.id);
            expect(res.body.data.user.collections[0]).toBe(
              res.body.data.collection.id
            );
            expect(res.body.data.collection.isPrivate).toBeTruthy();
          });
      });
    });
  });

  describe('/:id', function() {
    describe('GET', function() {
      it('returns a collection by ID', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        let collectionId;
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            collectionId = res.body.data.collection.id;

            return request(app)
              .get(`${apiV1}/collections/${collectionId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(200);
            expect(res.body.statusCode).toBe(200);
            expect(res.body.data.collection.id).toBe(collectionId);
          });
      });

      it('returns only public collections', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: true,
        };
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            const collectionId = res.body.data.collection.id;

            return request(app)
              .get(`${apiV1}/collections/${collectionId}`)
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
    });

    describe('PUT', function() {
      it('needs jwt authorization', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const recipe3 = await createNewRecipeId();
        const collectionOriginal = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collectionUpdated = {
          name: faker.lorem.words(),
          recipes: [recipe2, recipe3],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collectionOriginal)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            const collectionOriginalId = res.body.data.collection.id;

            return request(app)
              .put(`${apiV1}/collections/${collectionOriginalId}`)
              .send(collectionUpdated)
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

      it('updates a collection', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const recipe3 = await createNewRecipeId();
        const collectionOriginal = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collectionUpdated = {
          name: faker.lorem.words(),
          recipes: [recipe2, recipe3],
          isPrivate: false,
        };
        let collectionOriginalId;
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collectionOriginal)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            collectionOriginalId = res.body.data.collection.id;

            return request(app)
              .put(`${apiV1}/collections/${collectionOriginalId}`)
              .send(collectionUpdated)
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
            expect(res.body.data.collection.id).toBe(collectionOriginalId);
            expect(res.body.data.collection.name).toBe(collectionUpdated.name);
            expect(res.body.data.collection.recipes).toContain(recipe2);
            expect(res.body.data.collection.recipes).toContain(recipe3);
            expect(res.body.data.collection.isPrivate).toBe(
              collectionUpdated.isPrivate
            );
          });
      });

      it('validates against the schema', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const recipe3 = await createNewRecipeId();
        const collectionOriginal = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collectionUpdated = {
          name: '',
          recipes: [recipe2, recipe3],
          isPrivate: false,
        };
        let collectionOriginalId;
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
              .send(collectionOriginal)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            collectionOriginalId = res.body.data.collection.id;

            return request(app)
              .put(`${apiV1}/collections/${collectionOriginalId}`)
              .send(collectionUpdated)
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

    describe('DELETE', function() {
      it('needs jwt authorization', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };

        return createNewUser
          .then(function(res) {
            const token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            const collectionId = res.body.data.collection.id;

            return request(app)
              .delete(`${apiV1}/collections/${collectionId}`)
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

      it('deletes a collection', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        let token;
        let collectionId;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
            collectionId = res.body.data.collection.id;

            return request(app)
              .delete(`${apiV1}/collections/${collectionId}`)
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
            expect(res.body.data.collection).toBe(collectionId);
            expect(res.body.data.user.collections).toHaveLength(0);
          });
      });

      it('collection must exist to delete', async function() {
        const recipe1 = await createNewRecipeId();
        const recipe2 = await createNewRecipeId();
        const collection = {
          name: faker.lorem.words(),
          recipes: [recipe1, recipe2],
          isPrivate: false,
        };
        const collectionId = 'abc123';
        let token;

        return createNewUser
          .then(function(res) {
            token = res.body.data.token;

            return request(app)
              .post(`${apiV1}/collections`)
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
              .delete(`${apiV1}/collections/${collectionId}`)
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
            expect(res.body.message).toBe('Invalid ID');
          });
      });
    });
  });
});
