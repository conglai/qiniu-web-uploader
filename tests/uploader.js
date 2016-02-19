'use strict';
const Uploader = require('../lib/uploader').default;
const sinon = require('sinon');
let u;
let info = {
  emit: sinon.spy()
};
beforeEach(() => {
  u = new Uploader(info, 'upload');
});
describe('Uploader > doNextAction', () => {
  it('info.shouldStop = true', () => {
    info.shouldStop = true;
    let p = u.doNextAction();
    info.emit.should.be.calledWith('stop');
  });
  it('如果未上传完，执行uploadChunk', () => {
    info.shouldStop = false;
    info.blob = {
      size: 128 * 64
    };
    let c = 122;
    u._chunkInfos = [c];
    u.uploadChunk = sinon.spy();
    let p = u.doNextAction();
    u.uploadChunk.should.be.calledWith(c);
  });
  it('如果上传完，执行makeImgFile', () => {
    info.shouldStop = false;
    info.blob = {
      size: 128 * 64
    };
    u._chunkInfos = [];
    u.makeImgFile = sinon.spy();
    let p = u.doNextAction();
    u.makeImgFile.should.be.calledOnce();
  });
});
