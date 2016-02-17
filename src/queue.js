import Uploader from './core.jsx';
import { EventEmitter } from 'events';
import LoaderInfo from './info.jsx';
import Top, { log } from '../top.jsx';

const PARALLEL_NUM = 8;

export default class UploaderQueue extends EventEmitter {

  constructor() {
    super();
    this._loaderArr = [];
    this._infoArr = [];
    this._loadedArr = [];
  }

  destory() {
    this._infoArr.forEach(info => {
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
  }

  pushImg(file, uptoken) {
    let info = new LoaderInfo(file);
    let uploader = new Uploader(info, uptoken);
    this._loaderArr.push(uploader);
    this._infoArr.push(info);
    return info;
  }


  runUpload() {
    if(this.__isLoading) {
      return;
    }

    this.__isComplete = false;
    let loaderArr = this._loaderArr;
    this.__isLoading = true;
    let i = loaderArr.length;
    i = i > PARALLEL_NUM ? PARALLEL_NUM : i;
    i = i - 1;
    this._runLoaderNum = i + 1;
    for (; i >= 0; i--) {
      this._runSingleLoader(loaderArr.shift());
    };
  }

  _pushLoadedImg(uploader) {
    if(!this._runLoaderNum) {
      this.__isLoading = false;
    }
  }

  _runSingleLoader = async function(uploader) {
    let res = await uploader.doNextAction();
    let { complete, doNext, isStop } = res;
    if(isStop) {
      this.deleleInfo(uploader.info);
      this._runNextLoader();
    } else if(doNext) {
      this._runSingleLoader(uploader);
      this._calculateInfo();
    } else if(complete) {
      this._runNextLoader();
      this._pushLoadedImg(uploader);
    }
  };

  deleleInfo(info) {
    info.stop();
    let infoArr = [];
    this._infoArr.forEach(i => {
      if(info.uniqueId !== i.uniqueId) {
        infoArr.push(i);
      }
    });
    this._infoArr = infoArr;
    this.emit('delete', info);
  }

  get infos() {
    return this._infoArr;
  }

  _runNextLoader() {
    let nextUploader = this._loaderArr.shift();
    if(nextUploader) {
      this._runSingleLoader(nextUploader);
      this._calculateInfo();
    } else {
      this._calculateInfo();
      this._runLoaderNum --;
    }
  }

  _calculateInfo() {
    let infoArr = this._infoArr;
    let loaded = 0, total = 0;
    infoArr.forEach(info => {
      loaded += info.offset;
      total += info.size;
    });
    this.__bytesLoaded = loaded;
    this.__bytesTotal = total;
    if(total === loaded) {
      this.__isLoading = false;
      this.__isComplete = true;
      this.emit('complete');
    } else {
      if(!this.__isComplete) {
        this.emit('progress');
      }
    }
  }

  get bytesLoaded() {
    return this.__bytesLoaded;
  }
  get bytesTotal() {
    return this.__bytesTotal;
  }

  get isComplete() {
    return this.__isComplete;
  }
}
