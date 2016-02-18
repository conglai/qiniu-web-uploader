jest.dontMock('../src/info');

const UploaderInfo = require('../src/info').default;

let info = new UploaderInfo({
  lastModifiedDate: new Date,
  size: 123
});

describe('上传信息', () => {

  it('changes the text after click', () => {

    expect(info.size).toEqual(123);
  });

});
