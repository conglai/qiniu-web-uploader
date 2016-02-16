'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _top = require('../top.jsx');

var _top2 = _interopRequireDefault(_top);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NODE_QINIU_URL = '//7xme0g.com2.z0.glb.qiniucdn.com/';
if (process.env.NODE_ENV !== 'production') {
  NODE_QINIU_URL = '//7xlh8e.com2.z0.glb.qiniucdn.com/';
}

var uniqueId = 1;

var QNImageUploaderInfo = function (_EventEmitter) {
  (0, _inherits3.default)(QNImageUploaderInfo, _EventEmitter);

  function QNImageUploaderInfo(file) {
    (0, _classCallCheck3.default)(this, QNImageUploaderInfo);

    var _this = (0, _possibleConstructorReturn3.default)(this, _EventEmitter.call(this));

    _this._file = file;
    _this._size = file.size;
    _this.__uniqueId = uniqueId++;
    _this._lastModifiedDate = _top2.default.formatDate(file.lastModifiedDate, '-', false);
    return _this;
  }

  QNImageUploaderInfo.prototype.stop = function stop() {
    this._shouldStop = true;
  };

  QNImageUploaderInfo.prototype.setPreview = function setPreview(base64, rect) {
    this._preview = base64;
    this._rect = rect;
  };

  QNImageUploaderInfo.prototype.getRect = function getRect() {
    return this._rect;
  };

  (0, _createClass3.default)(QNImageUploaderInfo, [{
    key: 'uniqueId',
    get: function get() {
      return this.__uniqueId;
    }
  }, {
    key: 'lastModifiedDate',
    get: function get() {
      return this._lastModifiedDate;
    }
  }, {
    key: 'percent',
    get: function get() {
      return Math.floor(this.offset / this._size * 100);
    }
  }, {
    key: 'offset',
    set: function set(v) {
      this._offset = v;
    },
    get: function get() {
      return this._offset || 0;
    }
  }, {
    key: 'imgPath',
    get: function get() {
      return NODE_QINIU_URL + this._imgKey;
    }
    //七牛的Key

  }, {
    key: 'imgKey',
    set: function set(v) {
      this._imgKey = v;
    },
    get: function get() {
      return this._imgKey;
    }
  }, {
    key: 'nodeId',
    set: function set(v) {
      this._nodeId = v;
    },
    get: function get() {
      return this._nodeId;
    }
  }, {
    key: 'shouldStop',
    get: function get() {
      return this._shouldStop;
    }
  }, {
    key: 'preview',
    get: function get() {
      return this._preview;
    }
  }, {
    key: 'file',
    get: function get() {
      return this._file;
    }
  }, {
    key: 'blob',
    set: function set(v) {
      this._size = v.size;
      this._blob = v;
    },
    get: function get() {
      return this._blob;
    }
  }, {
    key: 'size',
    get: function get() {
      return this._size;
    }
  }]);
  return QNImageUploaderInfo;
}(_events.EventEmitter);

exports.default = QNImageUploaderInfo;