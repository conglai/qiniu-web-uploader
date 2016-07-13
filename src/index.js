import { EventEmitter } from 'events';
const UPLOAD_URL = '//upload.qiniu.com/';
const BLOCK_SIZE = 1024 * 1024 * 4;
const CHUNK_SIZE = 1024 * 128;

export default class QNImageUploader extends EventEmitter{

  constructor(imgFile, uptoken) {
    super();
    this._imgFile = imgFile;
    this._uptoken = uptoken;
  }

  get file() {
    return this._imgFile;
  }

  get offset() {
    return this._offset;
  }
  get percent() {
    let offset = this._offset || 0;
    let size = this._imgFile.size || 1;
    return offset / size;
  }

  get imgRes() {
    return this._imgRes;
  }

  get isCompleted() {
    return !!this._imgRes;
  }

  //## 把生成预览和上传片结合起来
  upload = async function(queue) {
    let imgFile = this._imgFile;
    let position = 0, currentCtx = '';
    let ctxList = [];
    while(position < imgFile.size) {
      let { ctx, lastPosition, isBlockEnd } = await this._uploadChunk(imgFile, position, currentCtx);
      if(this._cancel) {
        return new Promise((resolve, reject) => {
          this.emit('cancel');
          resolve({
            msg: 'upload is cancel'
          });
        });
      }
      this._offset = position = lastPosition;
      this.emit('progress');
      currentCtx = ctx;
      if(isBlockEnd) {
        ctxList.push(ctx);
      }
    }

    let res = await this._mkFile(ctxList, imgFile.size);
    this.emit('complete', res);
    return new Promise((resolve, reject) => {
      resolve(res);
    });
  };

  cancel() {
    this._cancel = true;
  }

  _errorTry = 10;//失败后尝试的次数
  //## 上传片，也包含创建块
  // 参考:
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/bput.html
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/mkblk.html
  _uploadChunk(blob, lastPosition, ctx) {
    let url;
    let offset = lastPosition % BLOCK_SIZE;
    let size = blob.size;
    if(offset === 0) {
      let blockSize = BLOCK_SIZE;
      if(lastPosition + BLOCK_SIZE > size) {
        blockSize = size - lastPosition;
      }
      url = UPLOAD_URL + 'mkblk/' + blockSize;
    } else {
      url = UPLOAD_URL + 'bput/' + ctx + '/' + offset;
    }
    let blobEnd = lastPosition + CHUNK_SIZE;
    blobEnd = blobEnd > size ? size : blobEnd;
    let chunk = blob.slice(lastPosition, blobEnd);

    return new Promise((resolve, reject) => {
      this._execPost(url, chunk, 'application/octet-stream', (err, res) => {
        if(err){
          reject(err);
        } else {
          resolve({
            ctx: res.ctx,
            lastPosition: blobEnd,
            isBlockEnd: blobEnd % BLOCK_SIZE === 0 || blobEnd === size
          });
        }
      });
    });
  }

  //## 创建文件
  // * http://developer.qiniu.com/docs/v6/api/reference/up/mkfile.html
  _mkFile(ctxList, size) {
    let url = UPLOAD_URL + 'mkfile/' + size + '/key/' + this._uptoken.key;

    return new Promise((resolve, reject) => {
      this._execPost(url, ctxList.join(','), 'text/plain', (err, res) => {
        if(err){
          reject(err);
        } else {
          this._imgRes = res;
          resolve(res);
        }
      });
    });
  }

  _execPost(url, data, contentType, cb) {
    let xhr = new XMLHttpRequest();
    let err;
    xhr.addEventListener('load', e => {
      let res = JSON.parse(xhr.responseText);
      cb(err, res);
    });
    xhr.addEventListener('error', e => {
      if(this._errorTry) {
        this._errorTry --;
        this._execPost(url, data, contentType, cb);
      } else {
        cb(e, {});
      }
    });
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('Authorization', 'UpToken ' + this._uptoken.uptoken);
    xhr.send(data);
  }

}
