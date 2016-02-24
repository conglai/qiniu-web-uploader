'use strict';
const Uploader = require('../lib/uploader').default;
const sinon = require('sinon');
describe('Uploader > doNextAction', () => {
  let u;
  let info = {
    emit: sinon.spy()
  };
  before(() => {
    u = new Uploader(info, 'upload');
  });
  it('info.shouldStop = true', () => {
    info.shouldStop = true;
    let p = u.doNextAction();
    info.emit.should.be.calledWith('stop');
    p.should.be.a.Promise();
  });
  it('如果未上传完，执行uploadChunk', () => {
    info.shouldStop = false;
    info.blob = {
      size: 128 * 64
    };
    let c = 122;
    u._chunkInfos = [c];
    u._uploadChunk = sinon.spy();
    u.doNextAction();
    u._uploadChunk.should.be.calledWith(c);
  });
  it('如果上传完，执行makeImgFile', () => {
    info.shouldStop = false;
    info.blob = {
      size: 128 * 64
    };
    u._chunkInfos = [];
    u._makeImgFile = sinon.spy();
    u.doNextAction();
    u._makeImgFile.should.be.calledOnce();
  });
});
