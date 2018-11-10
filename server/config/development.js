export default {
  db: {
    url: 'mongodb://localhost:27017/recipeShareDev',
  },
  secrets: {
    jwt: process.env.JWT_SECRET,
  },
  expireTime: '10d',
};
