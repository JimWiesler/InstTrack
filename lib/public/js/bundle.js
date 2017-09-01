(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// tbl is array like [{"idaction_type":1,"name":"Prequote Review"},
//                    {"idaction_type":2,"name":"Technical Review"},
//                    {"idaction_type":3,"name":"RFP"},
//                    {"idaction_type":4,"name":"PO Issue"}]
// idKey is object key used for the ID
// valKey is the value to be displayed in HOT table

var dropdownRef = function () {
  function dropdownRef(tbl, idKey, valKey) {
    _classCallCheck(this, dropdownRef);

    this.dd = [];
    this.idKey = idKey;
    this.valKey = valKey;
    this.keyByID = {};
    this.keyByVal = {};
    for (var i = 0; i < tbl.length; i++) {
      this.dd.push(tbl[i][valKey]);
      this.keyByID[tbl[i][idKey]] = tbl[i][valKey];
      this.keyByVal[tbl[i][valKey]] = tbl[i][idKey];
    }
  }

  // Takes single object or an array of objects and replaces IDs in Field with Values


  _createClass(dropdownRef, [{
    key: 'toVal',
    value: function toVal(data, field) {
      if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          if (typeof data[i][field] !== 'undefined' && typeof this.keyByID[data[i][field]] !== 'undefined') {
            data[i][field] = this.keyByID[data[i][field]];
          }
        }
      } else if (typeof data[field] !== 'undefined' && typeof this.keyByID[data[field]] !== 'undefined') {
        data[field] = this.keyByID[data[field]];
      }
    }

    // Takes an array of objects and replaces Values in Field with IDs

  }, {
    key: 'toID',
    value: function toID(data, field) {
      if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          if (typeof data[i][field] !== 'undefined' && typeof this.keyByVal[data[i][field]] !== 'undefined') {
            data[i][field] = this.keyByVal[data[i][field]];
          }
        }
      } else if (typeof data[field] !== 'undefined' && typeof this.keyByVal[data[field]] !== 'undefined') {
        data[field] = this.keyByVal[data[field]];
      }
    }
  }]);

  return dropdownRef;
}();

module.exports.dropdownRef = dropdownRef;

function xhrGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log('Request failed.  Returned status of ' + xhr.status);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  xhr.send();
}
module.exports.xhrGet = xhrGet;

function xhrPost(url, obj, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.onload = function () {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log('Request failed.  Returned status of ' + xhr.status);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  console.log('POST: ' + url + ', ' + JSON.stringify(obj));
  xhr.send(JSON.stringify(obj));
}
module.exports.xhrPost = xhrPost;

function HOTLogicalRowsToPhysical(HOT, logical) {
  var physical = void 0;
  if (typeof HOT.sortColumn === 'undefined' || typeof HOT.sortIndex === 'undefined' || HOT.sortIndex.length === 0) {
    physical = logical; // NO sorting so no translation
  } else {
    physical = HOT.sortIndex[logical][0];
  }
  return physical;
}
module.exports.HOTLogicalRowsToPhysical = HOTLogicalRowsToPhysical;

},{}],2:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hh = require('./HOThelper.js');

var portStr = window.location.port.length > 0 ? ':' + window.location.port : '';
var preRoute = window.location.protocol + '//' + window.location.hostname + portStr + '/';
var reviewers = ['Joe', 'Mike'];
var actionTypes = { prequote: 1, technical: 2, RFP: 3, PO: 4 };
var xhrTotalDropdown = void 0;
var xhrTotalActions = void 0;
var data = { prequote: null,
  technical: null,
  RFP: null,
  PO: null,
  HOT: { prequote: {}, technical: {}, RFP: {}, PO: {} },
  DD: { dispositionTypes: null, packages: null },
  changes: { prequote: [], technical: [], RFP: [], PO: [] },
  pendingChanges: { prequote: {}, technical: {}, RFP: {}, PO: {} } // by table row
};
window.HOTdata = data; // for console debugging

var UserException = function UserException(message) {
  _classCallCheck(this, UserException);

  this.message = message;
  this.name = 'UserException';
  console.log(message);
};

// *********************************************************************
// INSERT
// post: {"table": "action", "data": {"idaction": null, "action_type_idaction_type": 2,
//  "package_idpackage": "33", "reviewer": "Jim", "action_start":"1999-01-13", "action_end": null}}
// response : { "fieldCount": 0, "affectedRows": 1, "insertId": 12, "serverStatus": 2,
//  "warningCount": 0, "message": "", "protocol41": true, "changedRows": 0 }
// UPDATE
// post: {"table": "action", "data": {"idaction": 10, "action_type_idaction_type": 3,
//  "package_idpackage": "99", "reviewer": "Matt", "action_start":"1999-01-13"}}
// response : { "fieldCount": 0, "affectedRows": 1, "insertId": 0, "serverStatus": 2,
//  "warningCount": 0,  "message": "(Rows matched: 1  Changed: 1  Warnings: 0",
//  "protocol41": true, "changedRows": 1 }
// *********************************************************************


function postAction(table, row) {
  var change = data.pendingChanges[table][row];
  data.DD.dispositionTypes.toID(change, 'disposition_type_iddisposition_type');
  data.DD.packages.toID(change, 'package_idpackage');
  hh.xhrPost(preRoute + 'changeAction', { table: 'action', data: change }, function (stat, res) {
    if (stat === 'ERROR') throw new UserException('Error changing Action in table ' + table + ' row ' + row);
    if (res.insertId > 0) {
      // new item inserted
      data[table][row].idaction = res.insertId;
      data.HOT[table].render(); // render the table with new ID inserted
    }
  });
  delete data.pendingChanges[table][row]; // TODO - how to handle failed inserts?
}

// update database with pending changes
function updateDB() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(data.pendingChanges)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var table = _step.value;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(data.pendingChanges[table])[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var row = _step2.value;

          // POST pending changes with ID = null as INSERT requests; update ID to 'pending'
          if (data.pendingChanges[table][row].idaction == null) {
            postAction(table, row);
            data[table][row].idaction = 'pending';
          } else {
            // handle updates
            if (data.pendingChanges[table][row].idaction === 'pending') {
              // update id in change list with id from table
              data.pendingChanges[table][row].idaction = data[table][row].idaction;
            }
            // Handle UPDATE queries
            if (data.pendingChanges[table][row].idaction !== 'pending') {
              postAction(table, row);
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

// change is like [[0,"reviewer",null,"Mike"]] or [[row, colName, old, new]]
function handleHOTChanges(HOTtable, change, source) {
  // NOTE: logical not physical index passed in change event
  // https://github.com/handsontable/handsontable/issues/1501
  if (source === 'loadData') return; // data change emitted when data was loaded, do not change DB
  for (var i = 0; i < change.length; i++) {
    change[i][0] = hh.HOTLogicalRowsToPhysical(data.HOT[HOTtable], change[i][0]); // 2 phys row
    var HOTrow = change[i][0];
    if (typeof data.pendingChanges[HOTtable][HOTrow] === 'undefined') {
      // first data change for this data row
      // Create pending data structure to aggregate all changes to a single row
      data.pendingChanges[HOTtable][HOTrow] = {
        idaction: data[HOTtable][HOTrow].idaction,
        action_type_idaction_type: actionTypes[HOTtable]
      };
    }
    data.pendingChanges[HOTtable][HOTrow][change[i][1]] = change[i][3];
  }
  updateDB(); // initiate a database update of all pending changes
  data.changes[HOTtable].push(change);
  console.log('HOTtable: ' + HOTtable + ', Change: ' + JSON.stringify(change) + ', Source: ' + source);
}

function handleHOTDelete(HOTtable, visualSource) {
  // NOTE: contrary to HOT documentation, visualSource is array of physical (data source) indices
  var idList = visualSource.map(function (i) {
    return data[HOTtable][i].idaction;
  });
  console.log('Raw: ' + visualSource + ', IDs: ' + idList);
  hh.xhrPost(preRoute + 'deleteAction', { table: 'action', data: { key: 'idaction', ids: idList } }, function (stat, res) {
    if (stat === 'ERROR') throw new UserException('Error deleting Actions: ' + idList);
    console.log('Delete responses: ' + res.length);
  });
}

function buildHot() {
  // PreQuote Handsontable
  var container = document.getElementById('hot-prequote');
  var tzoffset = new Date().getTimezoneOffset() * 60000; // offset in milliseconds
  var localISOTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
  data.HOT.prequote = new Handsontable(container, {
    data: data.prequote,
    colHeaders: ['ID', 'Package', 'Start Date', 'Instruments', 'Revision', 'Reviewer', 'End Date', 'Status', 'Hours'],
    rowHeaders: false,
    fillHandle: 'vertical', // possible values: true, false, "horizontal", "vertical"
    contextMenu: ['remove_row'],
    dropdownMenu: ['filter_by_value', 'filter_by_condition', 'filter_action_bar'],
    filters: true,
    columnSorting: true,
    sortIndicator: true,
    minSpareRows: 1,
    currentRowClassName: 'currentRow',
    columns: [{ data: 'idaction', readOnly: true }, { data: 'package_idpackage', type: 'dropdown', source: data.DD.packages.dd, allowInvalid: false }, { data: 'action_start', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, defaultDate: localISOTime }, { data: 'act_count', type: 'numeric', allowInvalid: false }, { data: 'revision' }, { data: 'reviewer', type: 'dropdown', source: reviewers, allowInvalid: false }, { data: 'action_end', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, defaultDate: localISOTime }, { data: 'disposition_type_iddisposition_type', type: 'dropdown', source: data.DD.dispositionTypes.dd, allowInvalid: false }, { data: 'hours', type: 'numeric', allowInvalid: false }],
    afterChange: function afterChange(change, source) {
      handleHOTChanges('prequote', change, source);
    },
    beforeRemoveRow: function beforeRemoveRow(index, amount, visualSource) {
      handleHOTDelete('prequote', visualSource);
    },
    preventOverflow: 'horizontal',
    stretchH: 'all'
  });
}

// Requests different action types from the database based on GET getActions?actionType parameter
function getAction(type) {
  hh.xhrGet(preRoute + 'getActions?actionType=' + type, function (stat, tbl) {
    if (stat === 'ERROR') throw new UserException('Error fetching ' + type + ' actions');
    data.DD.dispositionTypes.toVal(tbl, 'disposition_type_iddisposition_type');
    data.DD.packages.toVal(tbl, 'package_idpackage');
    data[type] = tbl;
    xhrTotalActions--;
    if (xhrTotalActions === 0) buildHot();
  });
}

// Runs wafter window load after the dropdown types have been successsfully queried
function getActions() {
  xhrTotalActions = 4;
  getAction('prequote');
  getAction('technical');
  getAction('RFP');
  getAction('PO');
}

// First script executed.  On load of DOM
window.onloadScript = function () {
  // Activate first tab
  document.getElementsByClassName('tablinks')[0].click();
  // GET queries for the dropdown types
  // Disposition Types
  xhrTotalDropdown = 2;
  hh.xhrGet(preRoute + 'getTable?table=disposition_type', function (stat, tbl) {
    if (stat === 'ERROR') throw new UserException('Error fetching disposition_types');
    tbl.sort(function (a, b) {
      return a.iddisposition_type - b.iddisposition_type;
    });
    data.DD.dispositionTypes = new hh.dropdownRef(tbl, 'iddisposition_type', 'name');
    xhrTotalDropdown--;
    if (xhrTotalDropdown === 0) getActions();
  });

  // Packages
  hh.xhrGet(preRoute + 'getTable?table=package', function (stat, tbl) {
    if (stat === 'ERROR') throw new UserException('Error fetching packages');
    tbl.sort(function (a, b) {
      var nameA = a.name.toUpperCase(); // ignore upper and lowercase
      var nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    data.DD.packages = new hh.dropdownRef(tbl, 'idpackage', 'name');
    xhrTotalDropdown--;
    if (xhrTotalDropdown === 0) getActions();
  });
};

window.onload = window.onloadScript;

window.onresizeScript = function () {
  var div = document.getElementById('data-body');
  console.log('DIV: ' + div.clientWidth + ' x ' + div.clientHeight);
  data.HOT.prequote.updateSettings({ width: div.clientWidth, height: div.clientHeight });
};
window.onresize = window.onresizeScript;

window.openTab = function (evt, tabName) {
  var tabcontent = document.getElementsByClassName('tabcontent');
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none';
  }
  var tablinks = document.getElementsByClassName('tablinks');
  for (var _i = 0; _i < tablinks.length; _i++) {
    tablinks[_i].className = tablinks[_i].className.replace(' active', '');
  }
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';
};

},{"./HOThelper.js":1}]},{},[2]);
