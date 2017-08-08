'use strict';

/*
This file contains any server side modules needed.
*/

module.exports = {
  // Returns Hello World to the Autheicted Routes File when it is called
  test: function test() {
    return new Promise(function (resolve) {
      var hello = 'Hello World';
      console.log(hello);
      resolve(hello);
    });
  }
};