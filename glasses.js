const glassesInfo = require('./glassesInfo.js');
const serverOptions = require('./optionsParser');
const mime = require('mime-types')
const express = require('express');
const jsEval = require('eval')
const glassesTools = require('./glassesTools');
var bodyParser = require('body-parser');

var base64_encoded = function(str) {
    return new Buffer(str).toString('base64')   
};

var base64_decoded = function(str) {
    return new Buffer(str, 'base64').toString('utf8');
};

Array.prototype.last = function() {
    return this[this.length-1];
};

function split(s, separator, limit) {
    var arr = s.split(separator, limit);
    var left = s.substring(arr.join(separator).length + separator.length);
    arr.push(left);
    return arr;
}

const glasses = express();

glasses.set('view engine', 'ejs');
glasses.set('views', './pages');
glasses.use(bodyParser.urlencoded({extended:true}));
glasses.use(bodyParser.json());

var globalVars = {};

glasses.all(/(.*?)/, function(req, res) {
    res.setHeader('X-Powered-By', 'Glasses lightweight Node.js web server');
    res.setHeader('Glasses-Website', glassesInfo.website);
    if(serverOptions.blocked.includes(req.ip)) {
        res.statusCode = 403;
        res.render("403.ejs", {appendTitle: " 403 Forbidden", ip: req.ip, version: glassesInfo.version});
    } else {

        var routeDeploy = serverOptions.route;
        var _GETmethod;
        if(req.originalUrl.split("?")[0]!=='/') {
            _GETmethod = /\?(.*?)*/gi.exec(req.originalUrl);
            routeDeploy += req.originalUrl.replace(/\?(.*?)*/gi, '');
        } else {
            _GETmethod = /\?(.*?)*/gi.exec(req.originalUrl);
            routeDeploy += serverOptions.defaultPage;
        }

        if(_GETmethod) {
            _GETmethod = _GETmethod[0].slice(1);
            _GETmethod = _GETmethod.split('&');
            var tempGet = {};
            for(var i = 0; i<_GETmethod.length; i++) {
                var pSplit = split(_GETmethod[i], "=", 1);
                tempGet[pSplit[0]] = decodeURIComponent(pSplit[1]);
            }
            _GETmethod = tempGet;
        } else {
            _GETmethod = {};
        }
        var fs = require("fs");
        if (fs.existsSync(routeDeploy)) {
            if(routeDeploy.split(".").last()==="sjs") {
                var prototypeExtensions = fs.readFileSync('./glassesPrototypes.js', "utf8");
                var finalCode = prototypeExtensions;
                var sjsFile = fs.readFileSync(routeDeploy, "utf8");
                var echoContent = '';
                var echo = function(str) {
                    echoContent += str;
                }
                var nodeModule = function(module) {
                    return require(module);
                }
                var glassesVar = {
                    statusCode: 200,
                    charset: 'UTF-8',
                    contentType: 'text/html' 
                };
                var glassesIPvar = require("./glassesIPvar");
                glassesIPvar.ip.set(req.ip);
                var ipVars = {};
                var ipVarsSplitter = base64_decoded(glassesIPvar.file()).split(';');
                for(var v=0; v<ipVarsSplitter.length; v++) {
                    var splitLine = split(ipVarsSplitter[v], "=", 1);
                    ipVars[splitLine[0].replace(/\s/gi, '')] = splitLine[1];
                }
                var illegalNames = ["ip", "setTime"];
                var pageSetupUsed = false;
                var glassesFuncs = {
                    include: function(path) {
                        var currentPageDir = routeDeploy.split("/");
                        currentPageDir.pop();
                        currentPageDir = currentPageDir.join("/");
                        var getFile = fs.readFileSync(currentPageDir + '/' + path, "utf8");
                        var sjsIncludeParser = getFile.replace(/_\$(.*?)_/gi, '<%run echo($1); %>').replace(/<%sjs/gi, '<script run>').replace(/%>/gi, '</script>');
                        sjsIncludeParser = sjsIncludeParser.replace(/function (.*) {((.|[\r\n])*?)}/gi, function(m) {
                            var type = /function (.*) /gi.exec(m.split("\n")[0])[1].split(":")[1];
                            var name = /function (.*) /gi.exec(m.split("\n")[0])[1].split(":")[0];
                            var returnValue = /return (.*)(?!\s);/gi.exec(m)[1];
                            var newReturn = "return ";
                            switch(type) {
                                default:
                                    newReturn += returnValue + ';';
                                break;
                                case 'string':
                                case 'str':
                                    newReturn += 'String(' + returnValue + ');';
                                break;
                                case 'number':
                                case 'int':
                                    newReturn += 'Number(' + returnValue + ');';
                                break;
                                case 'boolean':
                                    var replace = returnValue.replace(/true/gi, 'true').replace(/false/gi, 'false');
                                    newReturn += (returnValue==="\"true\""? "true": "false") + ';';
                                break;
                                case 'undefined':
                                case 'null':
                                    newReturn += undefined + ';';
                                break;
                            }
                            var final = m.replace(/return (.*)(?!\s);/, newReturn).replace(/function (.*) /gi, "function " + name + " ");
                            return final;
                        });
                        sjsIncludeParser = sjsIncludeParser.replace(/\|(.*)\|/gi, function(m, c) {
                            var separator = c.split(/(?!\))(?!\s)*>(?!\s*")/gi);
                            var till = '';
                            for(var i=0; i<separator.length; i++) {
                                till = separator[i].replace(/\$\$/gi, till);
                            }
                            return till + ';';
                        });
                        sjsIncludeParser = sjsIncludeParser.split(/(?=<script run>)((.|[\r\n])*?)<\/script>/gi);
                        sjsIncludeParser.remove('%>');
                        var collectSJS = prototypeExtensions;
                        for(var i=0; i<sjsIncludeParser.length; i++) {
                            var val = sjsIncludeParser[i];
                            var getSlice = val.slice(0, 12);
                            var contentOnly = val;
                            if(getSlice==="<script run>") {
                                var dropScriptTags = contentOnly.replace(/<script run>|<\/script>/gi ,'');
                                collectSJS += dropScriptTags;
                            } else {
                                echo(val);
                            }
                        }
                        var _SEND = jsEval(collectSJS, sjsFuncs, true);
                        return _SEND;
                    },
                    ipVar: {
                        def: function(key, value) {
                            if(key.includes('=') || illegalNames.includes(key)) {
                                throw "Glasses: _IPVAR key cannot contain '=' and space characters. You can't also use these names: " + illegalNames.join(", ");
                            } else {
                                ipVars[key] = value;
                                glassesIPvar.def(key, value);
                            }
                        },
                        undef: function(key) {
                            if(key.includes('=') || illegalNames.includes(key)) {
                                throw "Glasses: _IPVAR, Cannot undef these names: " + illegalNames.join(", ");
                            } else {
                                ipVars[key] = undefined;
                                glassesIPvar.undef(key);
                            }
                        },
                        clear: function() {
                            glassesIPvar.clear()
                            ipVars = {};
                        }
                    },
                    global: {
                        set: function(key, val) {
                            globalVars[key] = val;
                        }
                    },
                    importPrototypeExtensions: function() {
                        echo('<script>' + prototypeExtensions.replace(/\n\r\t/gi , "") + '</script>');
                    }
                };
                var sjsFuncs = {
                    glasses: glassesFuncs,
                    $: glassesTools,
                    _GLOBAL: globalVars,
                    _IPVAR: ipVars,
                    _GET: _GETmethod,
                    _POST: req.body,
                    echo,
                    nodeModule
                };
                var sjsParser = sjsFile.replace(/_\$(.*?)_/gi, '<%run echo($1); %>').replace(/<%run/gi, '<script run>').replace(/%>/gi, '</script>');
                sjsParser = sjsParser.replace(/function (.*) {((.|[\r\n])*?)}/gi, function(m) {
                    var type = /function (.*) /gi.exec(m.split("\n")[0])[1].split(":")[1];
                    var name = /function (.*) /gi.exec(m.split("\n")[0])[1].split(":")[0];
                    var returnValue = /return (.*)(?!\s);/gi.exec(m)[1];
                    var newReturn = "return ";
                    switch(type) {
                        default:
                            newReturn += returnValue + ';';
                        break;
                        case 'string':
                        case 'str':
                            newReturn += 'String(' + returnValue + ');';
                        break;
                        case 'number':
                        case 'int':
                            newReturn += 'Number(' + returnValue + ');';
                        break;
                        case 'boolean':
                            var replace = returnValue.replace(/true/gi, 'true').replace(/false/gi, 'false');
                            newReturn += (returnValue==="\"true\""? "true": "false") + ';';
                        break;
                        case 'undefined':
                        case 'null':
                            newReturn += undefined + ';';
                        break;
                    }
                    var final = m.replace(/return (.*)(?!\s);/, newReturn).replace(/function (.*) /gi, "function " + name + " ");
                    return final;
                });
                sjsParser = sjsParser.replace(/\|(.*)\|/gi, function(m, c) {
                    var separator = c.split(/(?!\))(?!\s)*>(?!\s*")/gi);
                    var till = '';
                    for(var i=0; i<separator.length; i++) {
                        till = separator[i].replace(/\$\$/gi, till);
                    }
                    return till + ';';
                });
                sjsParser = sjsParser.split(/(?=<script run>)((.|[\r\n])*?)<\/script>/gi);
                sjsParser.remove('%>');
                for(var i=0; i<sjsParser.length; i++) {
                    var val = sjsParser[i];
                    var getSlice = val.slice(0, 12);
                    var contentOnly = val;
                    if(getSlice==="<script run>") {
                        var dropScriptTags = contentOnly.replace(/<script run>|<\/script>/gi ,'');
                        finalCode += dropScriptTags;
                    } else {
                        finalCode += 'echo(`' + contentOnly.replace(/\\/gi, '&#92;') + '`);';
                    }
                }
                jsEval(finalCode, sjsFuncs, true);
                res.writeHead(glassesVar.statusCode, {'Content-Type': '' + glassesVar.contentType + '; charset=' + glassesVar.charset + ';'});
                echoContent = echoContent.replace('  ', ' ');
                res.write(echoContent);
            } else {
                var getPage = fs.readFileSync(routeDeploy, "utf8");
                res.writeHead(200, {'Content-Type': mime.lookup(routeDeploy.split(".").last()) + '; charset=' + serverOptions.charset});
                res.write(getPage);
            }
        } else {
            res.statusCode = 404;
            res.render("404.ejs", {appendTitle: " 404 Not Found", version: glassesInfo.version});
        }
    }
    res.end();
});

for(var val of serverOptions.ports) {
    glasses.listen(val);
}

glasses.use(function (err, req, res, next) {
    res.statusCode = 500;
    var fs = require('fs');
    var dateTime = require('node-datetime');
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    fs.appendFileSync("logs.txt", '[' + formatted + '] ' + err + "\n");
    res.render("500.ejs", {appendTitle: " 500 Internal Error", error: (serverOptions.debug ? err : 'Contact your server admin or turn on the debug mode using .CONFIG file'), version: glassesInfo.version});
    res.end();
});

console.log("Thanks for choosing Glasses. Version: " + glassesInfo.version);
console.log("Glasses website: " + glassesInfo.website);
console.log("Glassess server is running on port" + (serverOptions.ports.length>1? "s": "") + ": ", serverOptions.ports.join(", "));
