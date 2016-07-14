import Uploader from './lib/index.js';
let input = document.getElementById('J_file');

input.addEventListener('change', e => {
  let uptoken = {"uptoken":"tBp6z8XoFNZV45YJ2NRdEsc-jKxCScWbg83GCNGl:3AT2-aSX_0MijTkkT6CU5Hv4e_M=:eyJzY29wZSI6IndpdGhtZS1jZG46d2l0aG1lLmJhY2suMjBkYTY3ZGIyY2I0NTYyNmUxMjY4Mzc4ZDYyMmU0OGMiLCJkZWFkbGluZSI6MTQ2ODQ4NTgzNH0=","key":"d2l0aG1lLmJhY2suMjBkYTY3ZGIyY2I0NTYyNmUxMjY4Mzc4ZDYyMmU0OGM="};
  let file = input.files[0];
  let uploader = new Uploader(file, uptoken);
  uploader.on('progress', e => {
    console.log(uploader.percent); //加载进度
    console.log(uploader.offset); //字节
  });
  uploader.on('complete', e => {
    console.log(uploader.imgRes); //文件
  });
  uploader.upload().then(imgRes => {
    console.log(imgRes);
  });
});
