(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// These are some useful helper functions that I have built up over time.
module.exports = {
  /* This function expects an array such as ['Nick', 'Bob', 'Nick'] and then sorts
  into two arrays [a, b]. It counts how many times a value is in the array and seperates it
  to the name and the amount of times it appears.
  The output would be ['Nick', 'Bob'] [2, 1]. */
  order: function order(arr) {
    var a = [];
    var b = [];
    var prev = void 0;

    arr.sort();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] !== prev) {
        a.push(arr[i]);
        b.push(1);
      } else {
        b[b.length - 1]++;
      }
      prev = arr[i];
    }
    return [a, b];
  },

  /* This helper function checks for an empty object. Return true if empty, returns
  false if not empty*/
  objectEmpty: function objectEmpty(obj) {
    var value = void 0;
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
      value = true;
    } else {
      value = false;
    }
    return value;
  }
};

},{}],2:[function(require,module,exports){
'use strict';

var _helper = require('./helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var obj = {
  Name: 'Test'
}; /* This is the file that browserfiy reads */

/*  The below way is the methof of importing modules and how to call modules
    DELETE THIS CODE WHEN USING THE CODE IT IS ONLY FOR SHOW */


var truthy = _helper2.default.objectEmpty(obj);

console.log(truthy);

},{"./helper":1}]},{},[2]);
