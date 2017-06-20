var dat = new Date();
var day = dat.getDate();
var month = dat.getMonth();
var year = dat.getFullYear();
var fullDate = Date(day + '/' + month + '/' + year);

console.log(fullDate);