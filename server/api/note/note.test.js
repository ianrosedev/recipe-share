/* eslint-disable prefer-arrow-callback, no-shadow, prefer-destructuring */
// prefer-arrow-callback: Always use standard function declaration for mocha
// no-shadow: Allow use of same paramater name nested
// prefer-destructuring: Assign to variable after getting data

import expect from 'expect';
import request from 'supertest';
import faker from 'faker';
import { apiV1, setup, teardown, resetDB } from '../../test/setup';
import app from '../../index';

describe('/notes', function() {
  let createNewUser;
  let recipe;
  let notes;

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

    recipe = createNewRecipe();

    notes = { text: faker.lorem.paragraph() };
  });
  after(teardown);
  afterEach(resetDB);

  describe('/:id', function() {
    describe('GET', function() {
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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('returns notes by recipe ID', function() {
        let token;
        let userId;
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
            userId = res.body.data.user.id;
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
              .get(`${apiV1}/notes/${recipeId}`)
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
            expect(res.body.data.notes.userId).toBe(userId);
            expect(res.body.data.notes.recipeId).toBe(recipeId);
            expect(res.body.data.notes.text).toBe(notes.text);
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
              .post(`${apiV1}/notes${recipeId}`)
              .send(notes)
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
              .get(`${apiV1}/notes/${recipeId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('adds a note and updates the user', function() {
        let token;
        let userId;
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
            userId = res.body.data.user.id;
            recipeId = res.body.data.recipe.id;

            return request(app)
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
            expect(res.body.data.notes.userId).toBe(userId);
            expect(res.body.data.notes.recipeId).toBe(recipeId);
            expect(res.body.data.notes.text).toBe(notes.text);
            expect(res.body.data.user.notes[0]).toBe(res.body.data.notes.id);
          });
      });

      it('`text` is required', function() {
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
              .post(`${apiV1}/notes/${recipeId}`)
              .send({})
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

    describe('PUT', function() {
      let updatedNotes;

      beforeEach(() => {
        updatedNotes = { text: faker.lorem.paragraph() };
      });

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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
              .put(`${apiV1}/notes/${recipeId}`)
              .send(updatedNotes)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('updates a note', function() {
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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
              .put(`${apiV1}/notes/${recipeId}`)
              .send(updatedNotes)
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
            expect(res.body.data.notes.text).toBe(updatedNotes.text);
          });
      });
    });

    describe('DELETE', function() {
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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
              .delete(`${apiV1}/notes/${recipeId}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            expect(res.status).toBe(401);
            expect(res.body.statusCode).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
          });
      });

      it('deletes a note', function() {
        let token;
        let recipeId;
        let notesId;

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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
              .set(
                'Authorization',
                `Bearer ${token}`,
                'Accept',
                'application/json'
              )
              .expect('Content-Type', /json/);
          })
          .then(function(res) {
            notesId = res.body.data.notes.id;

            return request(app)
              .delete(`${apiV1}/notes/${recipeId}`)
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
            expect(res.body.data.notes).toBe(notesId);
            expect(res.body.data.user.notes).toHaveLength(0);
          });
      });

      it('recipe must exist to delete note', function() {
        const badId = 'abc123';
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
              .post(`${apiV1}/notes/${recipeId}`)
              .send(notes)
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
              .delete(`${apiV1}/notes/${badId}`)
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
