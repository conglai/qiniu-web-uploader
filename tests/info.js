'use strict';
const UploaderInfo = require('../lib/info').default;
let info;
before(done => {
  info = new UploaderInfo({
    size: 123
  });
  done();
});
describe('上传的信息', () => {
  it('size 正确', () => {
    info.size.should.be.equal(123);
  });
});
