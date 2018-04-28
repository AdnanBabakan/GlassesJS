var b64Encode = function(str) {
    return new Buffer(str).toString('base64')   
};

var b64Decode = function(str) {
    return new Buffer(str, 'base64').toString('utf8');
};

var strRegEx = /[A-Za-z]\w+/g;

var randNum = function(min, max) {
    var argc = arguments.length;
    if (argc===0) {
        min = 0;
        max = 2147483647;
    } else if(argc===1) {
        throw ('Glasses Tools: \'randNum\' needs exactly 2 or 0 parameters.');
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
};

var randStr = function(min=2, max=min) {
    var chart = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    var randStr = '';
    for(var i=1; i<=randNum(min, max); i++) {
        randStr += chart[randNum(0, chart.length - 1)];
    }
    return randStr;
}

module.exports = {
    b64Encode, b64Decode,
    randNum, randStr
};