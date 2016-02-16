'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _top = require('../top.jsx');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UPLOAD_URL = 'http://upload.qiniu.com/';
var BLOCK_SIZE = 1024 * 1024 * 4;
var CHUNK_SIZE = 1024 * 128;
var BLOCK_CHUNK_NUM = BLOCK_SIZE / CHUNK_SIZE;

function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  var bb = new Blob([ab]);
  return bb;
}

var QNImageUploader = function () {
  function QNImageUploader(info) {
    (0, _classCallCheck3.default)(this, QNImageUploader);
    this._errorTry = 10;

    this._info = info;
    this.__ctxList = [];
  }

  QNImageUploader.prototype.destory = function destory() {
    this._info = null;
    delete this._info;
  };

  QNImageUploader.prototype._processImage = function _processImage(img, mimeType) {
    var fileCanvas = document.createElement('canvas');
    fileCanvas.width = img.naturalWidth;
    fileCanvas.height = img.naturalHeight;
    var ctx = fileCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    var base64 = fileCanvas.toDataURL(mimeType, 0.7);
    return dataURItoBlob(base64);
  };

  QNImageUploader.prototype._processPreview = function _processPreview(img, mimeType) {
    var previewCanvas = document.createElement('canvas');
    var maxSize = _top.dom.pageWidth / 3; //缩略图半屏
    var naturalWidth = img.naturalWidth;
    var naturalHeight = img.naturalHeight;
    var dw = 0;
    var dh = 0;
    var p = 1;
    if (naturalWidth > naturalHeight) {
      p = naturalWidth / maxSize;
    } else {
      p = naturalHeight / maxSize;
    }
    dw = Math.floor(naturalWidth / p);
    dh = Math.floor(naturalHeight / p);
    previewCanvas.width = dw;
    previewCanvas.height = dh;
    var ctx = previewCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, dw, dh);
    return {
      base64: previewCanvas.toDataURL(mimeType, 0.3),
      rect: {
        w: dw,
        h: dh
      }
    };
  };

  QNImageUploader.prototype.processFile = function processFile(file) {
    var _this = this;

    var previewUrl = window.URL.createObjectURL(file);
    var imgObj = new Image();
    var mimeType = file.type;
    var info = this._info;
    (0, _top.log)('file size:' + file.size);
    return new _promise2.default(function (resolve, reject) {
      imgObj.onload = function () {
        var _processPreview2 = _this._processPreview(imgObj, mimeType);

        var base64 = _processPreview2.base64;
        var rect = _processPreview2.rect;

        info.setPreview(base64, rect);
        var blob = _this._processImage(imgObj, mimeType);
        info.blob = blob;

        (0, _top.log)('blob size:' + blob.size);
        _this._chunkInfos = _this.generateChunkInfos(info.size);
        info.emit('preview');
        resolve({
          doNext: true
        });
      };
      imgObj.src = previewUrl;
    });
  };

  QNImageUploader.prototype.getImgUptoken = function getImgUptoken() {
    var _this2 = this;

    return new _promise2.default(function (resolve, reject) {
      _top.io.get('getimgkey').then(function (res) {
        // resolve(res.data);
        _this2._uptoken = res.data;
        resolve({
          doNext: true
        });
      });
    });
  };

  //获取分片的信息


  QNImageUploader.prototype.generateChunkInfos = function generateChunkInfos(size) {
    var leftSize = size % BLOCK_SIZE;
    var blockNum = leftSize ? Math.floor(size / BLOCK_SIZE) : size / BLOCK_SIZE;
    var chunkInfos = [];
    for (var i = 0; i < blockNum; i++) {
      for (var j = 0; j < BLOCK_CHUNK_NUM; j++) {
        var res = {
          offset: j * CHUNK_SIZE,
          end: j * CHUNK_SIZE + CHUNK_SIZE,
          blockNum: i
        };
        if (!j) {
          res.isBlock = true;
          res.blockSize = BLOCK_SIZE;
        }
        chunkInfos.push(res);
      };
    };
    if (leftSize) {
      var lastChunkSize = leftSize % CHUNK_SIZE;
      var lastChunkNum = Math.floor(leftSize / CHUNK_SIZE);
      for (var i = 0; i < lastChunkNum; i++) {
        var res = {
          offset: i * CHUNK_SIZE,
          end: i * CHUNK_SIZE + CHUNK_SIZE,
          blockNum: blockNum
        };
        if (!i) {
          res.isBlock = true;
          res.blockSize = leftSize;
        }
        chunkInfos.push(res);
      };
      if (lastChunkSize) {
        chunkInfos.push({
          offset: lastChunkNum * CHUNK_SIZE,
          blockNum: blockNum,
          end: lastChunkNum * CHUNK_SIZE + lastChunkSize
        });
      }
    }
    return chunkInfos;
  };

  //## 把生成预览和上传片结合起来


  QNImageUploader.prototype.doNextAction = function doNextAction() {
    var info = this._info;
    if (info.shouldStop) {
      return new _promise2.default(function (resolve, reject) {
        info.emit('stop');
        resolve({
          isStop: true
        });
      });
    }
    if (!info.blob) {
      return this.processFile(info.file);
    }
    if (!this._uptoken) {
      return this.getImgUptoken();
    }

    var chunkInfo = this._chunkInfos.shift();
    if (chunkInfo) {
      return this.uploadChunk(chunkInfo);
    } else {
      return this.makeImgFile();
    }
  };

  //## 上传片，也包含创建块
  // 参考:
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/bput.html
  //  * http://developer.qiniu.com/docs/v6/api/reference/up/mkblk.html

  QNImageUploader.prototype.uploadChunk = function uploadChunk(chunkInfo) {
    var _this3 = this;

    var info = this._info;
    var offset = chunkInfo.offset;
    var end = chunkInfo.end;
    var isBlock = chunkInfo.isBlock;
    var blockSize = chunkInfo.blockSize;
    var blockNum = chunkInfo.blockNum;
    var uptoken = this._uptoken.uptoken;

    var url = undefined;
    if (isBlock) {
      url = UPLOAD_URL + 'mkblk/' + blockSize;
    } else {
      url = UPLOAD_URL + 'bput/' + this.__lastCtx + '/' + offset;
    }
    var baseOffset = blockNum * BLOCK_SIZE;
    var blob = info.blob.slice(offset + baseOffset, end + baseOffset);
    return new _promise2.default(function (resolve, reject) {
      _this3._execPost(url, blob, 'application/octet-stream', uptoken, function (err, res) {
        if (err) {
          reject(err);
        } else {
          _this3.__lastCtx = res.ctx;
          if (!_this3._chunkInfos.length) {
            _this3.__ctxList.push(res.ctx);
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

  QNImageUploader.prototype._execPost = function _execPost(url, data, contentType, uptoken, cb) {
    var _this4 = this;

    var xhr = new XMLHttpRequest();
    var err = undefined;
    xhr.addEventListener('load', function (e) {
      var res = JSON.parse(xhr.responseText);
      cb(err, res);
    });
    xhr.addEventListener('error', function (e) {
      if (_this4._errorTry) {
        _this4._errorTry--;
        _this4._execPost(url, data, contentType, uptoken, cb);
      } else {
        cb(e, {});
      }
    });
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('Authorization', 'UpToken ' + uptoken);
    xhr.send(data);
  };

  //## 创建文件
  // * http://developer.qiniu.com/docs/v6/api/reference/up/mkfile.html


  QNImageUploader.prototype.makeImgFile = function makeImgFile() {
    var _this5 = this;

    var info = this._info;
    var _uptoken = this._uptoken;
    var key = _uptoken.key;
    var uptoken = _uptoken.uptoken;

    var url = UPLOAD_URL + 'mkfile/' + info.size + '/key/' + key;

    return new _promise2.default(function (resolve, reject) {
      _this5._execPost(url, _this5.__ctxList.join(','), 'text/plain', uptoken, function (err, res) {
        if (err) {
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

  (0, _createClass3.default)(QNImageUploader, [{
    key: 'info',
    get: function get() {
      return this._info;
    }
  }]);
  return QNImageUploader;
}();

exports.default = QNImageUploader;