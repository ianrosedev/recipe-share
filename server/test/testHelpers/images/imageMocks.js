import sinon from 'sinon';
import * as imageHelpers from '../../../helpers/image';

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
