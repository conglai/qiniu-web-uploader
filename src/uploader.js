const UPLOAD_URL = 'http://upload.qiniu.com/';
const BLOCK_SIZE = 1024 * 1024 * 4;
const CHUNK_SIZE = 1024 * 128;
const BLOCK_CHUNK_NUM = BLOCK_SIZE / CHUNK_SIZE;

function dataURItoBlob(dataURI) {
  let byteString = atob(dataURI.split(',')[1]);
  let ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  let bb = new Blob([ab]);
  return bb;
}

export default class QNImageUploader{

  constructor(info, uptoken) {
    this._info = info;
    this.__ctxList = [];
    this._uptoken = uptoken;
  }

  destory() {
    this._info = null;
    delete this._info;
  }

  get info() {
    return this._info;
  }

  _processImage(img, mimeType) {
    let fileCanvas = document.createElement('canvas');
    fileCanvas.width = img.naturalWidth;
    fileCanvas.height = img.naturalHeight;
    let ctx = fileCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    let base64 = fileCanvas.toDataURL(mimeType, 0.7);
    return dataURItoBlob(base64);
  }
  _processPreview(img, mimeType) {
    let previewCanvas = document.createElement('canvas');
    let maxSize = dom.pageWidth / 3; //缩略图半屏
    let naturalWidth = img.naturalWidth;
    let naturalHeight = img.naturalHeight;
    let dw = 0;
    let dh = 0;
    let p = 1;
    if(naturalWidth > naturalHeight) {
      p = naturalWidth / maxSize;
    } else {
      p = naturalHeight / maxSize;
    }
    dw = Math.floor(naturalWidth / p);
    dh = Math.floor(naturalHeight / p);
    previewCanvas.width = dw;
    previewCanvas.height = dh;
    let ctx = previewCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, dw, dh);
    return {
      base64: previewCanvas.toDataURL(mimeType, 0.3),
      rect: {
        w: dw,
        h: dh
      }
    };
  }

  processFile(file) {
    let previewUrl = window.URL.createObjectURL(file);
    let imgObj = new Image();
    let mimeType = file.type;
    let info = this._info;
    return new Promise((resolve, reject) => {
      imgObj.onload = () => {
        let { base64, rect } = this._processPreview(imgObj, mimeType);
        info.setPreview(base64, rect);
        let blob = this._processImage(imgObj, mimeType);
        info.blob = blob;
        this._chunkInfos = this.generateChunkInfos(info.size);
        info.emit('preview');
        resolve({
          doNext: true
        });
      };
      imgObj.src = previewUrl;
    });
  }


  //获取分片的信息
  generateChunkInfos(size) {
    let leftSize = size % BLOCK_SIZE;
    let blockNum = leftSize ? Math.floor(size / BLOCK_SIZE) : size / BLOCK_SIZE;
    let chunkInfos = [];
    for (let i = 0; i < blockNum; i++) {
      for (let j = 0; j < BLOCK_CHUNK_NUM; j++) {
        let res = {
          offset: j * CHUNK_SIZE,
          end: j * CHUNK_SIZE + CHUNK_SIZE,
          blockNum: i
        };
        if(!j) {
          res.isBlock = true;
          res.blockSize = BLOCK_SIZE;
        }
        chunkInfos.push(res);
      };
    };
    if(leftSize) {
      let lastChunkSize = leftSize % CHUNK_SIZE;
      let lastChunkNum = Math.floor(leftSize / CHUNK_SIZE);
      for (let i = 0; i < lastChunkNum; i++) {
        let res = {
          offset: i * CHUNK_SIZE,
          end: i * CHUNK_SIZE + CHUNK_SIZE,
          blockNum: blockNum
        };
        if(!i) {
          res.isBlock = true;
          res.blockSize = leftSize;
        }
        chunkInfos.push(res);
      };
      if(lastChunkSize) {
        chunkInfos.push({
          offset: lastChunkNum * CHUNK_SIZE,
          blockNum: blockNum,
          end: lastChunkNum * CHUNK_SIZE + lastChunkSize
        });
      }
    }
    return chunkInfos;
  }

  //## 把生成预览和上传片结合起来
  doNextAction() {
    let info = this._info;
    if(info.shouldStop) {
      return new Promise((resolve, reject) => {
        info.emit('stop');
        resolve({
          isStop: true
        });
      });
    }
    if(!info.blob) {
      return this.processFile(info.file);
    }
    let chunkInfo = this._chunkInfos.shift();
    if(chunkInfo) {
      return this.uploadChunk(chunkInfo);
    } else {
      return this.makeImgFile();
    }
  }

  _errorTry = 10;
  //## 上传片，也包含创建块
  // 参考:
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/bput.html
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/mkblk.html
  uploadChunk(chunkInfo) {
    let info = this._info;
    let { offset, end, isBlock,
      blockSize, blockNum } = chunkInfo;

    let { uptoken } = this._uptoken;
    let url;
    if(isBlock) {
      url = UPLOAD_URL + 'mkblk/' + blockSize;
    } else {
      url = UPLOAD_URL + 'bput/' + this.__lastCtx + '/' + offset;
    }
    let baseOffset = blockNum * BLOCK_SIZE;
    let blob = info.blob.slice(offset + baseOffset, end + baseOffset);
    return new Promise((resolve, reject) => {
      this._execPost(url, blob, 'application/octet-stream', uptoken, (err, res) => {
        if(err){
          reject(err);
        } else {
          this.__lastCtx = res.ctx;
          if(!this._chunkInfos.length) {
            this.__ctxList.push(res.ctx);
          }
          info.offset = end;
          info.emit('progress');
          resolve({
            doNext: true
          });
        }
      });
    });
  };

  _execPost(url, data, contentType, uptoken, cb) {
    let xhr = new XMLHttpRequest();
    let err;
    xhr.addEventListener('load', e => {
      let res = JSON.parse(xhr.responseText);
      cb(err, res);
    });
    xhr.addEventListener('error', e => {
      if(this._errorTry) {
        this._errorTry --;
        this._execPost(url, data, contentType, uptoken, cb);
      } else {
        cb(e, {});
      }
    });
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('Authorization', 'UpToken ' + uptoken);
    xhr.send(data);
  }

  //## 创建文件
  // * http://developer.qiniu.com/docs/v6/api/reference/up/mkfile.html
  makeImgFile() {
    let info = this._info;
    let { key, uptoken } = this._uptoken;
    let url = UPLOAD_URL + 'mkfile/' + info.size + '/key/' + key;

    return new Promise((resolve, reject) => {
      this._execPost(url, this.__ctxList.join(','), 'text/plain', uptoken, (err, res) => {
        if(err){
          reject(err);
        } else {
          info.emit('complete');
          info.imgKey = res.key;
          resolve({
            complete: true
          });
        }
      });
    });
  };

}
