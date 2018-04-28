// Strings

String.prototype.firstCap = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.reverse = function() {
    return this.split("").reverse().join("");
};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

// Numbers

Number.prototype.posIt = function() {
	var num = this;
	return ((num < 0) ? num * -1 : num);
};

Number.prototype.negIt = function() {
	var num = this;
	return ((num > 0) ? num * -1 : num);
};

Number.prototype.reverse = function() {
    var n = this + "";
	return Number(n.split("").reverse().join(""));
};

// Arrays

Array.prototype.last = function() {
    return this[this.length-1];
};

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

Array.prototype.unique = function() {
    var arr = [];
    for(var i=0; i<this.length; i++) {
        if(!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
};

// Objects

Object.prototype.stringify = function() {
    return JSON.stringify(this);
};

Object.prototype.length = function() {
    var num = 0;
    for(var key in this) {
        num++;
    }
    return num - 2;
};

Object.prototype.keyOf = function(val) {
    for(var key in this) {
        if(this[key]===val) {
            return key;
        }
    }
};