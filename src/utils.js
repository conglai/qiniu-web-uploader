module.exports = {
  formatDate: (date = new Date(), str='.', noTime=true) => {
    let monthNum = date.getMonth() + 1;
    let monthStr = monthNum < 10 ?  '0' + monthNum : monthNum;
    let dateNum = date.getDate();
    let dateStr = dateNum < 10 ?  '0' + dateNum : dateNum;
    if(noTime) {
      return date.getFullYear()
        + str + monthStr
        + str + dateStr;
    } else {
      return date.getFullYear()
        + str + monthStr
        + str + dateStr
        + ' ' + date.getHours()
        + ':' + date.getMinutes()
        + ':' + date.getSeconds();
    }
  }
};
