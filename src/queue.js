import Uploader from './core.jsx';
import { EventEmitter } from 'events';
import LoaderInfo from './info.jsx';
import Top, { log } from '../top.jsx';

const PARALLEL_NUM = 8;

export default class UploaderQueue extends EventEmitter {

  constructor(notBuildNode = false) {
    super();
    this._notBuildNode = notBuildNode;
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

  pushImg(file) {
    let info = new LoaderInfo(file);
    let uploader = new Uploader(info);
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
    if(this._notBuildNode) {
      return;
    }
    let loadedArr = this._loadedArr;
    let runLoaderNum = this._runLoaderNum;

    loadedArr.push(uploader);
    if(!runLoaderNum || loadedArr.length > 9) {
      this._buildNodes(!runLoaderNum);
    }
    if(!runLoaderNum) {
      this.__isLoading = false;
    }
  }

  _buildNodes = async function(isComplete) {
    let loadedArr = this._loadedArr;
    this._loadedArr = [];
    let nodes = loadedArr.map(loader => {
      let info = loader.info;
      return {
        addr: info.imgKey,
        camera_date: info.lastModifiedDate
      };
    });
    let res = await Top.io.post('nnode', {
      build_type: 5,
      nodes: JSON.stringify(nodes)
    });
    let nids = res.data.nids;
    let infos = this._infoArr;
    infos.forEach(info => {
      let nid = nids[info.imgKey];
      if(nid) {
        info.nodeId = nid;
      }
    });
    if(isComplete) {
      this.__isComplete = true;
      this.emit('complete');
    }

  };

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
    this.emit('delete');
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
      if(!info.size) {
        log('info.size:' + info.size);
        log(info);
      }
    });
    this.bytesLoaded = loaded;
    this.bytesTotal = total;
    if(total === loaded && this._notBuildNode) {
      this.__isLoading = false;
      this.__isComplete = true;
      if(this._notBuildNode) {
        this.emit('complete');
      }
    } else {
      if(!this.__isComplete) {
        this.emit('progress');
      }
    }
  }

  set bytesLoaded(v) {
    this.__bytesLoaded = v;
  }
  get bytesLoaded() {
    return this.__bytesLoaded;
  }
  set bytesTotal(v) {
    this.__bytesTotal = v;
  }
  get bytesTotal() {
    return this.__bytesTotal;
  }

  get isComplete() {
    return this.__isComplete;
  }


}
