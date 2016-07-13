# 七牛上传模块[![Build Status](https://travis-ci.org/conglai/qiniu-web-uploader.svg?branch=master)](https://travis-ci.org/conglai/qiniu-web-uploader)

##功能
* 压缩后上传

## NPM

```
npm i qiniu-web-uploader
```

## 使用

```js
import Uploader from 'qiniu-web-uploader';

/*
{
  uptoken: 'asdfsdf', //七牛上传凭证
  key: 'sdfa' //base63字符串
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
