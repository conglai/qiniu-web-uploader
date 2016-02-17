# 七牛上传模块

```
import { UploaderQueue } from 'qiniu-web-uploader';

let queue = new UplUploaderQueue();
queue.push(file, uptoken); // file为input，只能压缩图片，uptoken为七牛上传凭证

queue.runUpload()
```
