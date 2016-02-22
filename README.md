# 七牛上传模块[![Build Status](https://travis-ci.org/conglai/qiniu-web-uploader.svg?branch=master)](https://travis-ci.org/conglai/qiniu-web-uploader)

##功能
* 压缩后上传

## NPM

```
npm i qiniu-web-uploader
```

## 使用

```js
import { UploaderQueue } from 'qiniu-web-uploader';

let queue = new UplUploaderQueue();
queue.push(file, uptoken); // file为input，只能压缩图片，uptoken为七牛上传凭证

queue.runUpload()
```
