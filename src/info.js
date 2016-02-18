import { EventEmitter } from 'events';

let uniqueId = 1;
export default class QNImageUploaderInfo extends EventEmitter{
  constructor(file) {
    super();
    this._file = file;
    this._size = file.size;
    this.__uniqueId = uniqueId ++;
  }

  get uniqueId() {
    return this.__uniqueId;
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
