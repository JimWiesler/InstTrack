'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // Routes in this module require authentication


// Importing authentication flow


// Importing the server side modules.


var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cirrusAuthModule = require('cirrus-auth-module');

var _cirrusAuthModule2 = _interopRequireDefault(_cirrusAuthModule);

var _test = require('../server-controllers/test');

var _test2 = _interopRequireDefault(_test);

var _database = require('../server-controllers/database');

var _database2 = _interopRequireDefault(_database);

var _buildQuery = require('./buildQuery');

var _buildQuery2 = _interopRequireDefault(_buildQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

// authenticate our router
_cirrusAuthModule2.default.authenticate(router);

router.get('/', function (req, res) {
  res.render('index');
});

// index route
router.get('/about', function (req, res) {
  _test2.default.test().then(function (data) {
    return res.render('about', {
      title: data
    });
  }).catch(function (e) {
    res.status(500, {
      error: e
    });
  });
});

router.get('/StatusEntry', function (req, res) {
  res.render('StatusEntry');
});

router.get('/getTable', function (req, res) {
  var tables = ['action', 'action_type', 'area', 'disposition_type', 'isr_package_task', 'paciv_report', 'package', 'package_type', 'prequote', 'tag', 'task'];
  if (typeof req.query.table !== 'string' || tables.indexOf(req.query.table) === -1) {
    res.send('{ "err": "invalid table name" }');return;
  }
  var sql = 'SELECT * from ie43t2.' + req.query.table + ';';
  _database2.default.query(sql, [], function (err, res2) {
    if (err) {
      console.log('Callback error: ' + err);
      res.status(500);
      res.json({});
    } else {
      res.json(res2);
    }
  });
});

router.get('/getActions', function (req, res) {
  var actionTypes = ['prequote', 'technical', 'RFP', 'PO'];
  if (typeof req.query.actionType !== 'string' || actionTypes.indexOf(req.query.actionType) === -1) {
    res.send('{ "err": "invalid action type" }');
    return;
  }
  var sql = void 0;
  switch (req.query.actionType) {
    case 'prequote':
      sql = 'select idaction, package_idpackage, DATE_FORMAT(action_start,\'%Y-%m-%d\') as action_start,\n           act_count, revision, reviewer, DATE_FORMAT(action_end,\'%Y-%m-%d\') as action_end,\n           disposition_type_iddisposition_type, hours\n        from action where action_type_idaction_type = 1 order by action_start asc;';
      break;
    case 'technical':
      sql = 'select idaction, package_idpackage, DATE_FORMAT(action_start,\'%Y-%m-%d\') as action_start,\n           act_count, revision, reviewer, DATE_FORMAT(action_end,\'%Y-%m-%d\') as action_end,\n           disposition_type_iddisposition_type, hours\n        from action where action_type_idaction_type = 2 order by action_start asc;';
      break;
    case 'RFP':
      sql = 'select idaction, package_idpackage, DATE_FORMAT(action_start,\'%Y-%m-%d\') as action_start,\n           act_count, revision, product_cost, document_cost, transportation_cost\n        from action where action_type_idaction_type = 3 order by action_start asc;';
      break;
    case 'PO':
      sql = 'select idaction, package_idpackage, DATE_FORMAT(action_start,\'%Y-%m-%d\') as action_start,\n           act_count, revision\n        from action where action_type_idaction_type = 4 order by action_start asc;';
      break;
    default:
  }
  _database2.default.query(sql, [], function (err, res2) {
    if (err) {
      console.log('Callback error: ' + err);
      res.status(500);
      res.json({});
    } else {
      res.json(res2);
    }
  });
});

// Put request to insert or update item in database
// post body should be in form {"table": "action", "data": { "foreignkey": 1, "field": null}}
router.post('/changeAction', function (req, res) {
  if (typeof req.body.table === 'string' && req.body.table === 'action' && // validate POST body
  _typeof(req.body.data) === 'object') {
    // TODO: validate and clean input from webpage
    var sql = (0, _buildQuery2.default)('action', 'idaction', req.body.data);
    _database2.default.query(sql, [], function (err, res2) {
      if (err) {
        console.log('Callback error: ' + err);
        res.status(500);
        res.json({});
      } else {
        // Insert res = { "fieldCount": 0,  "affectedRows": 1, "insertId": 10, "serverStatus": 2,
        //       "warningCount": 0, "message": "", "protocol41": true, "changedRows": 0 }
        res.json(res2);
      }
    });
  } else {
    res.status(500);
    res.json({ error: 'Invalid POST format' });
  }
});

function multiQuery(sql, status) {
  _database2.default.query(sql, [], function (err, res2) {
    status.count--;
    status.results.push(res2);
    if (err) status.success = false;
    if (status.count === 0) {
      // all queries have returned
      if (!status.success) {
        status.res.status(500);
        status.res.json(status.results);
      } else {
        status.res.json(status.results);
      }
    }
  });
}

// post body should be in following form:
// {"table": "action", "data": { "key": "idaction", "ids": [1, 2, 5, 7]}}
router.post('/deleteAction', function (req, res) {
  if (typeof req.body.table === 'string' && req.body.table === 'action' && // validate POST body
  _typeof(req.body.data) === 'object') {
    // TODO: validate and clean input from webpage
    var mStat = { count: req.body.data.ids.length, res: res, success: true, results: [] };
    for (var i = 0; i < req.body.data.ids.length; i++) {
      var sql = 'DELETE FROM ' + req.body.table + ' WHERE ' + req.body.data.key + '=\'' + req.body.data.ids[i] + '\';';
      multiQuery(sql, mStat);
    }
  } else {
    res.status(500);
    res.json({ error: 'Invalid POST format' });
  }
});

module.exports = router;