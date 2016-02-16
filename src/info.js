import { EventEmitter } from 'events';
import Top from '../top.jsx';

var NODE_QINIU_URL = '//7xme0g.com2.z0.glb.qiniucdn.com/';
if(process.env.NODE_ENV !== 'production') {
  NODE_QINIU_URL = '//7xlh8e.com2.z0.glb.qiniucdn.com/';
}

let uniqueId = 1;
export default class QNImageUploaderInfo extends EventEmitter{

  constructor(file) {
    super();
    this._file = file;
    this._size = file.size;
    this.__uniqueId = uniqueId ++;
    this._lastModifiedDate = Top.formatDate(file.lastModifiedDate, '-', false);
  }

  get uniqueId() {
    return this.__uniqueId;
  }
  get lastModifiedDate() {
    return this._lastModifiedDate;
  }

  get percent() {
    return Math.floor(this.offset / this._size * 100);
  }

  set offset(v) {
    this._offset = v;
  }
  get offset() {
    return this._offset || 0;
  }

  get imgPath() {
    return NODE_QINIU_URL + this._imgKey;
  }
  //七牛的Key
  set imgKey(v) {
    this._imgKey = v;
  }
  get imgKey() {
    return this._imgKey;
  }

  set nodeId(v) {
    this._nodeId = v;
  }
  get nodeId() {
    return this._nodeId;
  }

  stop() {
    this._shouldStop = true;
  }

  get shouldStop() {
    return this._shouldStop;
  }

  setPreview(base64, rect) {
    this._preview = base64;
    this._rect = rect;
  }
  getRect() {
    return this._rect;
  }
  get preview() {
    return this._preview;
  }
  get file() {
    return this._file;
  }
  set blob(v) {
    this._size = v.size;
    this._blob = v;
  }
  get blob() {
    return this._blob;
  }
  get size() {
    return this._size;
  }

}
