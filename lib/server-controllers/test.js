'use strict';

/*
This file contains any server side modules needed.
*/

module.exports = {
  // Returns hello to the Autheicted Routes File when it is called
  test: function test() {
    return new Promise(function (resolve) {
      var hello = 'This is dynmaicly rendered from the Server! Find me in src/server-controllers/';
      console.log(hello);
      resolve(hello);
    });
  }
};