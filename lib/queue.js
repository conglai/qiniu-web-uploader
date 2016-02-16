'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('./core.jsx');

var _core2 = _interopRequireDefault(_core);

var _events = require('events');

var _info = require('./info.jsx');

var _info2 = _interopRequireDefault(_info);

var _top = require('../top.jsx');

var _top2 = _interopRequireDefault(_top);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PARALLEL_NUM = 8;

var UploaderQueue = function (_EventEmitter) {
  (0, _inherits3.default)(UploaderQueue, _EventEmitter);

  function UploaderQueue() {
    var notBuildNode = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
    (0, _classCallCheck3.default)(this, UploaderQueue);

    var _this = (0, _possibleConstructorReturn3.default)(this, _EventEmitter.call(this));

    _this._buildNodes = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(isComplete) {
        var loadedArr, nodes, res, nids, infos;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                loadedArr = this._loadedArr;

                this._loadedArr = [];
                nodes = loadedArr.map(function (loader) {
                  var info = loader.info;
                  return {
                    addr: info.imgKey,
                    camera_date: info.lastModifiedDate
                  };
                });
                _context.next = 5;
                return _top2.default.io.post('nnode', {
                  build_type: 5,
                  nodes: (0, _stringify2.default)(nodes)
                });

              case 5:
                res = _context.sent;
                nids = res.data.nids;
                infos = this._infoArr;

                infos.forEach(function (info) {
                  var nid = nids[info.imgKey];
                  if (nid) {
                    info.nodeId = nid;
                  }
                });
                if (isComplete) {
                  this.__isComplete = true;
                  this.emit('complete');
                }

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      return function (_x2) {
        return ref.apply(this, arguments);
      };
    }();

    _this._runSingleLoader = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(uploader) {
        var res, complete, doNext, isStop;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return uploader.doNextAction();

              case 2:
                res = _context2.sent;
                complete = res.complete;
                doNext = res.doNext;
                isStop = res.isStop;

                if (isStop) {
                  this.deleleInfo(uploader.info);
                  this._runNextLoader();
                } else if (doNext) {
                  this._runSingleLoader(uploader);
                  this._calculateInfo();
                } else if (complete) {
                  this._runNextLoader();
                  this._pushLoadedImg(uploader);
                }

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      return function (_x3) {
        return ref.apply(this, arguments);
      };
    }();

    _this._notBuildNode = notBuildNode;
    _this._loaderArr = [];
    _this._infoArr = [];
    _this._loadedArr = [];
    return _this;
  }

  UploaderQueue.prototype.destory = function destory() {
    this._infoArr.forEach(function (info) {
      info.stop();
    });
    this._loaderArr = [];
    this._infoArr = [];
    this._loadedArr = [];
    this._tmpRunArr = [];
    this.__isLoading = false;
    this.__isComplete = false;
    this._queueStop = false;
    this.__bytesLoaded = 0;
    this.__bytesTotal = 0;
  };

  UploaderQueue.prototype.pushImg = function pushImg(file) {
    var info = new _info2.default(file);
    var uploader = new _core2.default(info);
    this._loaderArr.push(uploader);
    this._infoArr.push(info);
    return info;
  };

  UploaderQueue.prototype.runUpload = function runUpload() {
    if (this.__isLoading) {
      return;
    }

    this.__isComplete = false;
    var loaderArr = this._loaderArr;
    this.__isLoading = true;
    var i = loaderArr.length;
    i = i > PARALLEL_NUM ? PARALLEL_NUM : i;
    i = i - 1;
    this._runLoaderNum = i + 1;
    for (; i >= 0; i--) {
      this._runSingleLoader(loaderArr.shift());
    };
  };

  UploaderQueue.prototype._pushLoadedImg = function _pushLoadedImg(uploader) {
    if (this._notBuildNode) {
      return;
    }
    var loadedArr = this._loadedArr;
    var runLoaderNum = this._runLoaderNum;

    loadedArr.push(uploader);
    if (!runLoaderNum || loadedArr.length > 9) {
      this._buildNodes(!runLoaderNum);
    }
    if (!runLoaderNum) {
      this.__isLoading = false;
    }
  };

  UploaderQueue.prototype.deleleInfo = function deleleInfo(info) {
    info.stop();
    var infoArr = [];
    this._infoArr.forEach(function (i) {
      if (info.uniqueId !== i.uniqueId) {
        infoArr.push(i);
      }
    });
    this._infoArr = infoArr;
    this.emit('delete');
  };

  UploaderQueue.prototype._runNextLoader = function _runNextLoader() {
    var nextUploader = this._loaderArr.shift();
    if (nextUploader) {
      this._runSingleLoader(nextUploader);
      this._calculateInfo();
    } else {
      this._calculateInfo();
      this._runLoaderNum--;
    }
  };

  UploaderQueue.prototype._calculateInfo = function _calculateInfo() {
    var infoArr = this._infoArr;
    var loaded = 0,
        total = 0;
    infoArr.forEach(function (info) {
      loaded += info.offset;
      total += info.size;
      if (!info.size) {
        (0, _top.log)('info.size:' + info.size);
        (0, _top.log)(info);
      }
    });
    this.bytesLoaded = loaded;
    this.bytesTotal = total;
    if (total === loaded && this._notBuildNode) {
      this.__isLoading = false;
      this.__isComplete = true;
      if (this._notBuildNode) {
        this.emit('complete');
      }
    } else {
      if (!this.__isComplete) {
        this.emit('progress');
      }
    }
  };

  (0, _createClass3.default)(UploaderQueue, [{
    key: 'infos',
    get: function get() {
      return this._infoArr;
    }
  }, {
    key: 'bytesLoaded',
    set: function set(v) {
      this.__bytesLoaded = v;
    },
    get: function get() {
      return this.__bytesLoaded;
    }
  }, {
    key: 'bytesTotal',
    set: function set(v) {
      this.__bytesTotal = v;
    },
    get: function get() {
      return this.__bytesTotal;
    }
  }, {
    key: 'isComplete',
    get: function get() {
      return this.__isComplete;
    }
  }]);
  return UploaderQueue;
}(_events.EventEmitter);

exports.default = UploaderQueue;