import sinon from 'sinon';
import fs from 'fs';
import util from 'util';
import * as imageHelpers from '../../../helpers/image';

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

export const cloudinaryPostMock = () =>
  sinon.stub(imageHelpers, 'cloudinaryPost').returns({
    public_id: 'SuperMario',
    version: 1544149655,
    signature: 'Zelda',
    width: 300,
    height: 300,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2018-12-07T02:27:35Z',
    tags: [],
    bytes: 9392,
    type: 'upload',
    etag: 'abcd1234',
    placeholder: false,
    url: 'http://res.cloudinary.com/recipe-share/image/upload/super/mario.jpg',
    secure_url:
      'https://res.cloudinary.com/recipe-share/image/upload/super/mario.jpg',
    original_filename: 'SuperMetroid',
  });

export const cloudinaryTempFileCleanup = async () => {
  try {
    const directory = './tmp';
    const files = await readdir(directory);
    const unlinkPromises = files.map(filename =>
      unlink(`${directory}/${filename}`)
    );

    return await Promise.all(unlinkPromises);
  } catch (err) {
    console.log(err);
  }
};
