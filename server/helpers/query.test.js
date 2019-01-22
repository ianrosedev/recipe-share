/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import httpMocks from 'node-mocks-http';
import { apiV1, setup, teardown, resetDB } from '../test/setup';
import {
  validateQuery,
  queryFind,
  queryFindAndPopulate,
  queryPaginate,
  findAndSort,
} from './query';
import app from '../index';
import User from '../api/user/userModel';
import Recipe from '../api/recipe/recipeModel';
import Tag from '../api/tag/tagModel';
import Collection from '../api/collection/collectionModel';

describe('query', function() {
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
  let createNewUser;

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
  });
  after(teardown);
  afterEach(resetDB);

  describe('validateQuery', function() {
    it('returns a valid query', function() {
      const query = {
        tags: `${faker.lorem.word()}, ${faker.lorem.word()}, ${faker.lorem.word()}`,
        inc: `${faker.lorem.word()}, ${faker.lorem.word()}`,
        notInc: `${faker.lorem.word()}, ${faker.lorem.word()}`,
        createdAt: 'desc',
        rating: 'asc',
        stars: '5',
        limit: '30',
        offset: '10',
      };
      const allowedParams = [
        'tags',
        'inc',
        'notInc',
        'createdAt',
        'rating',
        'stars',
        'limit',
        'offset',
      ];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toEqual({
        tags: query.tags,
        inc: query.inc,
        notInc: query.notInc,
        createdAt: query.createdAt,
        rating: query.rating,
        stars: query.stars,
        limit: query.limit,
        offset: query.offset,
      });
    });

    it('returns an empty array if no allowed params match the query', function() {
      const query = { inc: faker.lorem.word() };
      const allowedParams = ['rating'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toEqual({});
    });

    it('`tag` rejects an invalid query', function() {
      const query = { tags: '😈' };
      const allowedParams = ['tags'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toBe(false);
    });

    it('`inc` rejects an invalid query', function() {
      const query = { inc: '😈' };
      const allowedParams = ['inc'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toBe(false);
    });

    it('`notInc` rejects an invalid query', function() {
      const query = { notInc: '😈' };
      const allowedParams = ['notInc'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toBe(false);
    });

    it('`createdAt` can be `asc || desc`', function() {
      const queryAsc = { createdAt: 'asc' };
      const queryDesc = { createdAt: 'desc' };
      const allowedParams = ['createdAt'];
      const validatedAsc = validateQuery(queryAsc, allowedParams);
      const validatedDesc = validateQuery(queryDesc, allowedParams);

      expect(validatedAsc).toEqual(queryAsc);
      expect(validatedDesc).toEqual(queryDesc);
    });

    it('`createdAt` rejects an invalid query', function() {
      const query = {
        createdAt: faker.lorem.word(),
      };
      const allowedParams = ['createdAt'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toBe(false);
    });

    it('`rating` can be `asc || desc`', function() {
      const queryAsc = { rating: 'asc' };
      const queryDesc = { rating: 'desc' };
      const allowedParams = ['rating'];
      const validatedAsc = validateQuery(queryAsc, allowedParams);
      const validatedDesc = validateQuery(queryDesc, allowedParams);

      expect(validatedAsc).toEqual(queryAsc);
      expect(validatedDesc).toEqual(queryDesc);
    });

    it('`rating` rejects an invalid query', function() {
      const query = {
        rating: faker.lorem.word(),
      };
      const allowedParams = ['rating'];
      const validated = validateQuery(query, allowedParams);

      expect(validated).toBe(false);
    });

    it('`stars` can be `1-5`', function() {
      const oneStars = { stars: '1' };
      const twoStars = { stars: '2' };
      const threeStars = { stars: '3' };
      const fourStars = { stars: '4' };
      const fiveStars = { stars: '5' };
      const allowedParams = ['stars'];
      const validatedOneStars = validateQuery(oneStars, allowedParams);
      const validatedTwoStars = validateQuery(twoStars, allowedParams);
      const validatedThreeStars = validateQuery(threeStars, allowedParams);
      const validatedFourStars = validateQuery(fourStars, allowedParams);
      const validatedFiveStars = validateQuery(fiveStars, allowedParams);

      expect(validatedOneStars).toEqual(oneStars);
      expect(validatedTwoStars).toEqual(twoStars);
      expect(validatedThreeStars).toEqual(threeStars);
      expect(validatedFourStars).toEqual(fourStars);
      expect(validatedFiveStars).toEqual(fiveStars);
    });

    it('`stars` rejects an invalid query', function() {
      const negativeStars = { stars: '-1' };
      const noStars = { stars: '0' };
      const millionStars = { stars: '1000000' };
      const notANumber = { stars: faker.lorem.word() };
      const allowedParams = ['stars'];
      const validatedNegativeStars = validateQuery(
        negativeStars,
        allowedParams
      );
      const validatedNoStars = validateQuery(noStars, allowedParams);
      const validatedMillionStars = validateQuery(millionStars, allowedParams);
      const validatedNotANumber = validateQuery(notANumber, allowedParams);

      expect(validatedNegativeStars).toBe(false);
      expect(validatedNoStars).toBe(false);
      expect(validatedMillionStars).toBe(false);
      expect(validatedNotANumber).toBe(false);
    });

    it('`limit` can be `>= 0`', function() {
      const noLimit = { limit: '0' };
      const tenLimit = { limit: '10' };
      const twentyLimit = { limit: '20' };
      const hundredLimit = { limit: '100' };
      const allowedParams = ['limit'];
      const validatedNoLimit = validateQuery(noLimit, allowedParams);
      const validatedTenLimit = validateQuery(tenLimit, allowedParams);
      const validatedTwentyLimit = validateQuery(twentyLimit, allowedParams);
      const validatedHunderdLimit = validateQuery(hundredLimit, allowedParams);

      expect(validatedNoLimit).toEqual(noLimit);
      expect(validatedTenLimit).toEqual(tenLimit);
      expect(validatedTwentyLimit).toEqual(twentyLimit);
      expect(validatedHunderdLimit).toEqual(hundredLimit);
    });

    it('`limit` rejects an invalid query`', function() {
      const negativeLimit = { limit: '-10' };
      const notANumber = { limit: faker.lorem.word() };
      const allowedParams = ['limit'];
      const validatedNegativeLimit = validateQuery(
        negativeLimit,
        allowedParams
      );
      const validatedNotANumber = validateQuery(notANumber, allowedParams);

      expect(validatedNegativeLimit).toBe(false);
      expect(validatedNotANumber).toBe(false);
    });

    it('`offset` can be `>= 0`', function() {
      const noOffset = { offset: '0' };
      const tenOffset = { offset: '10' };
      const twentyOffset = { offset: '20' };
      const hundredOffset = { offset: '100' };
      const allowedParams = ['offset'];
      const validatedNoOffset = validateQuery(noOffset, allowedParams);
      const validatedTenOffset = validateQuery(tenOffset, allowedParams);
      const validatedTwentyOffset = validateQuery(twentyOffset, allowedParams);
      const validatedHunderdOffset = validateQuery(
        hundredOffset,
        allowedParams
      );

      expect(validatedNoOffset).toEqual(noOffset);
      expect(validatedTenOffset).toEqual(tenOffset);
      expect(validatedTwentyOffset).toEqual(twentyOffset);
      expect(validatedHunderdOffset).toEqual(hundredOffset);
    });

    it('`offset` rejects an invalid query`', function() {
      const negativeOffset = { offset: '-10' };
      const notANumber = { offset: faker.lorem.word() };
      const allowedParams = ['offset'];
      const validatedNegativeOffset = validateQuery(
        negativeOffset,
        allowedParams
      );
      const validatedNotANumber = validateQuery(notANumber, allowedParams);

      expect(validatedNegativeOffset).toBe(false);
      expect(validatedNotANumber).toBe(false);
    });
  });

  describe('queryFind', function() {
    it('finds and sorts a query from the database', function() {
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
        .then(function() {
          const options = { sort: { createdAt: 'desc' } };

          return queryFind(Recipe, options);
        })
        .then(function(res) {
          // Check that order is descending
          expect(Math.sign(res[0].createdAt - res[1].createdAt)).toBe(1);
          expect(Math.sign(res[1].createdAt - res[2].createdAt)).toBe(1);
        });
    });

    it('`model` param is required', async function() {
      const model = null;
      const options = { createdAt: 'desc' };

      try {
        await queryFind(model, options);
        throw new Error('Test should have failed!');
      } catch (err) {
        expect(err.name).toBe('TypeError');
        expect(err.message).toBe('`model` is required');
      }
    });
  });

  describe('queryFindAndPopulate', function() {
    it('finds and sorts a nested query from the database', function() {
      const recipe1 = createNewRecipe();
      const recipe2 = createNewRecipe();
      const recipe3 = createNewRecipe();
      let token;
      let userId;

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
          userId = res.body.data.user.id;

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
          const path = 'recipes';
          const options = {
            sort: { createdAt: 'desc' },
            match: { rating: '5' },
          };

          return queryFindAndPopulate(User, userId, path, options);
        })
        .then(function(res) {
          // Check that order is descending
          expect(Math.sign(res[0].createdAt - res[1].createdAt)).toBe(1);
          expect(Math.sign(res[1].createdAt - res[2].createdAt)).toBe(1);
        });
    });

    it('`model` param is required', async function() {
      const model = null;
      const id = 'abc123';
      const path = 'recipes';
      const options = { createdAt: 'desc' };

      try {
        await queryFindAndPopulate(model, id, path, options);
        throw new Error('Test should have failed!');
      } catch (err) {
        expect(err.name).toBe('TypeError');
        expect(err.message).toBe('`model` is required');
      }
    });

    it('`id` param is required', async function() {
      const model = User;
      const id = null;
      const path = 'recipes';
      const options = { createdAt: 'desc' };

      try {
        await queryFindAndPopulate(model, id, path, options);
        throw new Error('Test should have failed!');
      } catch (err) {
        expect(err.name).toBe('TypeError');
        expect(err.message).toBe('`id` is required');
      }
    });

    it('`path` param is required', async function() {
      const model = User;
      const id = 'abc123';
      const path = null;
      const options = { createdAt: 'desc' };

      try {
        await queryFindAndPopulate(model, id, path, options);
        throw new Error('Test should have failed!');
      } catch (err) {
        expect(err.name).toBe('TypeError');
        expect(err.message).toBe('`path` is required');
      }
    });
  });

  describe('queryPaginate', function() {
    it('returns a slice of the data provided', function() {
      const data = new Array(100);
      const offset = 20;
      const limit = 30;

      for (let i = 0; i < data.length; i += 1) {
        data[i] = faker.lorem.word();
      }

      const paginated = queryPaginate(data, offset, limit);

      expect(paginated[0]).toBe(data[offset]);
      expect(paginated[paginated.length - 1]).toBe(data[offset + limit - 1]);
      expect(paginated).toHaveLength(limit);
    });

    it('returns null if offset is out of bounds', function() {
      const data = new Array(100);
      const offset = 900;
      const limit = 30;

      for (let i = 0; i < data.length; i += 1) {
        data[i] = faker.lorem.word();
      }

      const paginated = queryPaginate(data, offset, limit);
      expect(paginated).toBeNull();
    });

    it('`data` param is required', function() {
      const data = null;
      const offset = 20;
      const limit = 30;

      try {
        queryPaginate(data, offset, limit);
        throw new Error('Test should have failed!');
      } catch (err) {
        expect(err.name).toBe('TypeError');
        expect(err.message).toBe('`data` is required');
      }
    });
  });

  describe('findAndSort', function() {
    beforeEach(async () => {
      await Recipe.deleteMany({});
    });

    it('returns a valid query', function() {
      const recipe1 = createNewRecipe();
      const recipe2 = createNewRecipe();
      const recipe3 = createNewRecipe();
      let token;

      // ~NOTE~
      // `Model.insertMany` is too fast for the test,
      // all times are exact matches
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
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { createdAt: 'desc', stars: '5' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(3);
          // Check that order is descending
          expect(
            Math.sign(
              new Date(res.data.recipes[0].createdAt) -
                new Date(res.data.recipes[1].createdAt)
            )
          ).toBe(1);
          expect(
            Math.sign(
              new Date(res.data.recipes[1].createdAt) -
                new Date(res.data.recipes[2].createdAt)
            )
          ).toBe(1);
          expect(res.data.recipes[0].rating).toBe(5);
          expect(res.data.recipes[1].rating).toBe(5);
          expect(res.data.recipes[2].rating).toBe(5);
        });
    });

    it('`createdAt` filters a search correctly', function() {
      const recipe1 = createNewRecipe();
      const recipe2 = createNewRecipe();
      const recipe3 = createNewRecipe();
      let token;

      // ~NOTE~
      // `Model.insertMany` is too fast for the test,
      // all times are exact matches
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
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { createdAt: 'asc' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(3);
          // Check that order is ascending
          expect(
            Math.sign(
              new Date(res.data.recipes[2].createdAt) -
                new Date(res.data.recipes[1].createdAt)
            )
          ).toBe(1);
          expect(
            Math.sign(
              new Date(res.data.recipes[1].createdAt) -
                new Date(res.data.recipes[0].createdAt)
            )
          ).toBe(1);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { createdAt: 'desc' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(3);
          // Check that order is descending
          expect(
            Math.sign(
              new Date(res.data.recipes[0].createdAt) -
                new Date(res.data.recipes[1].createdAt)
            )
          ).toBe(1);
          expect(
            Math.sign(
              new Date(res.data.recipes[1].createdAt) -
                new Date(res.data.recipes[2].createdAt)
            )
          ).toBe(1);
        });
    });

    it('`rating` filters a search correctly', function() {
      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          const userId = user._id;
          const recipe1 = { ...createNewRecipe(), rating: '1', userId };
          const recipe2 = { ...createNewRecipe(), rating: '3', userId };
          const recipe3 = { ...createNewRecipe(), rating: '5', userId };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { rating: 'asc' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(3);
          // Check that order is ascending
          expect(res.data.recipes[0].rating).toBe(1);
          expect(res.data.recipes[1].rating).toBe(3);
          expect(res.data.recipes[2].rating).toBe(5);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { rating: 'desc' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(3);
          // Check that order is descending
          expect(res.data.recipes[0].rating).toBe(5);
          expect(res.data.recipes[1].rating).toBe(3);
          expect(res.data.recipes[2].rating).toBe(1);
        });
    });

    it('`stars` filters a search correctly', function() {
      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          const userId = user._id;
          const recipe1 = { ...createNewRecipe(), rating: '1', userId };
          const recipe2 = { ...createNewRecipe(), rating: '1', userId };
          const recipe3 = { ...createNewRecipe(), rating: '5', userId };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { stars: '1' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(2);
          // 1 star
          expect(res.data.recipes[0].rating).toBe(1);
          expect(res.data.recipes[1].rating).toBe(1);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { stars: '5' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          // 5 stars
          expect(res.data.recipes[0].rating).toBe(5);
        });
    });

    it('`tags` filters a search correctly', async function() {
      const tag1 = await Tag.create({ name: 'Foo' });
      const tag2 = await Tag.create({ name: 'Bar' });
      const tag3 = await Tag.create({ name: 'Baz' });
      const tag4 = await Tag.create({ name: 'Qux' });
      const tag5 = await Tag.create({ name: 'Yaz' });
      let userId;
      let recipe1;
      let recipe2;
      let recipe3;

      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          userId = user._id;
          recipe1 = {
            ...createNewRecipe(),
            tags: [tag1._id, tag2._id, tag3._id],
            userId,
          };
          recipe2 = {
            ...createNewRecipe(),
            tags: [tag2._id, tag3._id],
            userId,
          };
          recipe3 = {
            ...createNewRecipe(),
            tags: [tag4._id, tag5._id],
            userId,
          };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { tags: 'Bar' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(2);
          expect(res.data.groupLength).toBe(2);
          expect(res.data.recipes[0].tags).toContain(String(tag2._id));
          expect(res.data.recipes[1].tags).toContain(String(tag2._id));
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { tags: 'Qux, Yaz' },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.recipes[0].tags).toContain(String(tag4._id));
          expect(res.data.recipes[0].tags).toContain(String(tag5._id));
        });
    });

    it('`inc` filters a search correctly', function() {
      const ingredient1 = 'Fish';
      const ingredient2 = 'Tortillas';
      const ingredient3 = 'Cheese';
      const ingredient4 = 'Lettuce';
      const ingredient5 = 'Tomato';
      let userId;
      let recipe1;
      let recipe2;
      let recipe3;

      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          userId = user._id;
          recipe1 = {
            ...createNewRecipe(),
            ingredients: [ingredient1, ingredient2, ingredient3],
            userId,
          };
          recipe2 = {
            ...createNewRecipe(),
            ingredients: [ingredient2, ingredient4, ingredient5],
            userId,
          };
          recipe3 = {
            ...createNewRecipe(),
            ingredients: [ingredient1, ingredient5],
            userId,
          };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { inc: ingredient1 },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(2);
          expect(res.data.groupLength).toBe(2);
          expect(res.data.recipes[0].ingredients).toContain(ingredient1);
          expect(res.data.recipes[1].ingredients).toContain(ingredient1);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { inc: `${ingredient4},${ingredient5}` },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.recipes[0].ingredients).toContain(ingredient4);
          expect(res.data.recipes[0].ingredients).toContain(ingredient5);
        });
    });

    it('`notInc` filters a search correctly', function() {
      const ingredient1 = 'Fish';
      const ingredient2 = 'Tortillas';
      const ingredient3 = 'Cheese';
      const ingredient4 = 'Lettuce';
      const ingredient5 = 'Tomato';
      let userId;
      let recipe1;
      let recipe2;
      let recipe3;

      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          userId = user._id;
          recipe1 = {
            ...createNewRecipe(),
            ingredients: [ingredient1, ingredient2, ingredient3],
            userId,
          };
          recipe2 = {
            ...createNewRecipe(),
            ingredients: [ingredient2, ingredient4, ingredient5],
            userId,
          };
          recipe3 = {
            ...createNewRecipe(),
            ingredients: [ingredient1, ingredient5],
            userId,
          };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { notInc: ingredient1 },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.recipes[0].ingredients).not.toContain(ingredient1);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { notInc: `${ingredient4},${ingredient5}` },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.recipes[0].ingredients).not.toContain(ingredient4);
          expect(res.data.recipes[0].ingredients).not.toContain(ingredient5);
        });
    });

    it('`inc` and `notInc` work together to filter a search', function() {
      const ingredient1 = 'Fish';
      const ingredient2 = 'Tortillas';
      const ingredient3 = 'Cheese';
      const ingredient4 = 'Lettuce';
      const ingredient5 = 'Tomato';
      const ingredient6 = 'Eggs';
      const ingredient7 = 'Tofu';
      const ingredient8 = 'Beets';
      let userId;
      let recipe1;
      let recipe2;
      let recipe3;

      return createNewUser
        .then(async function(res) {
          const user = await User.findOne({});
          userId = user._id;
          recipe1 = {
            ...createNewRecipe(),
            ingredients: [
              ingredient1,
              ingredient2,
              ingredient3,
              ingredient4,
              ingredient5,
            ],
            userId,
          };
          recipe2 = {
            ...createNewRecipe(),
            ingredients: [
              ingredient4,
              ingredient5,
              ingredient6,
              ingredient7,
              ingredient8,
            ],
            userId,
          };
          recipe3 = {
            ...createNewRecipe(),
            ingredients: [ingredient1, ingredient5, ingredient8],
            userId,
          };

          await Recipe.insertMany([recipe1, recipe2, recipe3]);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: {
              inc: `${ingredient4},${ingredient5}`,
              notInc: ingredient1,
            },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.recipes[0].ingredients).toContain(ingredient4);
          expect(res.data.recipes[0].ingredients).toContain(ingredient5);
          expect(res.data.recipes[0].ingredients).not.toContain(ingredient1);
        })
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Recipe,
            as: 'recipes',
            query: { inc: ingredient1, notInc: ingredient7 },
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(2);
          expect(res.data.groupLength).toBe(2);
          expect(res.data.recipes[0].ingredients).toContain(ingredient1);
          expect(res.data.recipes[0].ingredients).not.toContain(ingredient7);
          expect(res.data.recipes[1].ingredients).toContain(ingredient1);
          expect(res.data.recipes[1].ingredients).not.toContain(ingredient7);
        });
    });

    it('`filter` filters a search with a custom filter', async function() {
      const createNewRecipeId = () => {
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
        .then(async function() {
          const response = httpMocks.createResponse();

          // Needed data goes to `response` object
          await findAndSort(null, response, null, {
            model: Collection,
            as: 'collections',
            filter: collection => collection.isPrivate === false,
          });

          return JSON.parse(response._getData());
        })
        .then(function(res) {
          expect(res.statusCode).toBe(200);
          expect(res.data.length).toBe(1);
          expect(res.data.groupLength).toBe(1);
          expect(res.data.collections).toHaveLength(1);
          expect(res.data.collections[0].id).toBe(collection1Id);
        });
    });
  });
});
