'use strict';
const Uploader = require('../lib/uploader').default;
const sinon = require('sinon');
let u;
let info = {
  emit: sinon.spy()
};
before(() => {
  u = new Uploader(info, 'upload');
});
describe('Uploader > doNextAction', () => {
  it('info.shouldStop = true', () => {
    info.shouldStop = true;

    let p = u.doNextAction();
    info.emit.should.be.calledWith('stop');
  });
});
