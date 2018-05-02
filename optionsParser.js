function extend(dest, src) {
	for(var key in src) {
		dest[key] = src[key];
	}
	return dest;
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function rand(min, max) {
    var argc = arguments.length
    if (argc === 0) {
      min = 0
      max = 2147483647
    } else if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given')
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

const fs = require("fs");
var configFile = fs.readFileSync("config.config", "utf8");
var configLineParser = configFile.split(/\n/gi);
configLineParser.remove("");

var ports = [];
var blocked = [];
var defaultPage = '/default.sjs';
var route = '/public_html';
var debugMode = false;
var charset = 'utf-8';
var secretKey = '';

var i = 1;
var errorCalc = 0;
for(var val of configLineParser) {
    var args = val.split(/\s/gi);
    switch(args[0]) {
        default:
            console.log("Option \"" + args[0] + "\" is not defined. \".CONFIG\" File line: " + i);
            errorCalc++;
        break;
        case '#':
        case '':
        break;
        case 'Listen':
            ports.push(args[1]);
        break; 
        case 'Block':
            args.shift();
            blocked = blocked.concat(args);
            blocked.remove("");
        break;
        case 'Default':
            defaultPage = '/' + args[1];
        break;
        case 'Route':
            route = args[1];
        break;
        case 'Debug':
            switch(args[1]) {
                default:
                case 'off':
                    debugMode = false;
                break;
                case 'on':
                    debugMode = true;
                break;
            }
        break;
        case 'Charset':
            charset = args[1];
        break;
        case 'SecretKey':
            secretKey = args[1];
        break;
    }
    i++;
}

if(errorCalc>0) {
    console.log("There were errors which are logged above, Glasses had to stop process due to erros.");
    process.exit();
}

var aPorts = (ports.length>0 ? ports : ["80"]);

var userOptions = {
    ports: aPorts,
    blocked: blocked,
    defaultPage: defaultPage,
    route: '.' + route,
    debug: debugMode,
    charset: charset,
    secretKey: secretKey
};

module.exports = userOptions;
