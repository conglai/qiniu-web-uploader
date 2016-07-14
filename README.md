# 七牛上传模块[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url]
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://npmjs.org/package/qiniu-web-uploader
[npm-version-image]: http://img.shields.io/npm/v/qiniu-web-uploader.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/qiniu-web-uploader.svg?style=flat

##功能
* 七牛分片上传

## NPM

```
npm i qiniu-web-uploader
```

## 使用

```js
import Uploader from 'qiniu-web-uploader';

/*
uptoken:
{
  uptoken: 'asdfsdf', //七牛上传凭证
  key: 'sdfa' //base64字符串，new Buffer(key).toString('base64')
}
*/
let uploader = new Uploader(file, uptoken);

uploader.on('progress', () => {
  console.log(uploader.percent); //加载进度
  console.log(uploader.offset); //字节
  console.log(uploader.file); //文件
});
uploader.on('cancel', () => {
  //取消
});
uploader.on('complete', () => {
  console.log(uploader.imgRes); //文件
});

let imgRes = await uploader.upload(); //返回七牛返回的Key
uploader.cancel(); //取消
```
