const serverOptions = require("./optionsParser");
var fs = require('fs');
const cryptr = require('cryptr');

var secretKey = serverOptions.secretKey;
const coder = new cryptr(secretKey);

var base64_encoded = function(str) {
    return new Buffer(str).toString('base64')   
};
var base64_decoded = function(str) {
    return new Buffer(str, 'base64').toString('utf8');
};

var getSecretKey = function() {
    return secretKey;
}

var userIp;
var setIp = function(getIp) {
    userIp = getIp;
}
var getIp = function() {
    return userIp;
}

var dateTime = require('node-datetime');

var getFile = function() {
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    var filePath = './ip_var_storage/' + base64_encoded(userIp);
    if(fs.existsSync(filePath)) {
        return coder.decrypt(fs.readFileSync(filePath, "utf8")); 
    } else {
        var defaultArgs = 'ip=' + userIp + ';' + "\n" + 'setTime=' + formatted + ';';
        fs.writeFileSync(filePath, coder.encrypt(base64_encoded(defaultArgs)));
        return coder.decrypt(fs.readFileSync(filePath, "utf8")); 
    }
};

var defVar = function(key, val) {
    var filePath = './ip_var_storage/' + base64_encoded(userIp);
    var decodeFile = base64_decoded(coder.decrypt(fs.readFileSync(filePath, "utf8"))).split("\n");
    for(var i=0; i<decodeFile.length; i++) {
        var splitter = decodeFile[i].split('=');
        if(splitter[0]===key) {
            decodeFile.splice(i, 1);
        }
    }
    decodeFile = decodeFile.join("\n");
    var newFile = decodeFile + "\n" + key + '=' + val + ';';
    fs.writeFileSync(filePath, coder.encrypt(base64_encoded(newFile)));
};

var undefVar = function(key) {
    var filePath = './ip_var_storage/' + base64_encoded(userIp);
    var decodeFile = base64_decoded(coder.decrypt(fs.readFileSync(filePath, "utf8"))).split("\n");
    for(var i=0; i<decodeFile.length; i++) {
        var splitter = decodeFile[i].split('=');
        if(splitter[0]===key) {
            decodeFile.splice(i, 1);
        }
    }
    decodeFile = decodeFile.join("\n");
    fs.writeFileSync(filePath, coder.encrypt(base64_encoded(decodeFile)));
}

var clear = function() {
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    var filePath = './ip_var_storage/' + base64_encoded(userIp);
    fs.unlinkSync(filePath);
    return {ip: userIp, setTime: formatted};
}

module.exports = {
    secretKey: {
        get: getSecretKey
    },
    ip: {
        set: setIp,
        get: getIp
    },
    file: getFile,
    def: defVar,
    undef: undefVar,
    clear: clear
};