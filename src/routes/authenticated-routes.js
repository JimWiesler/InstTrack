// Routes in this module require authentication
import express from 'express';

// Importing authentication flow
import auth from 'cirrus-auth-module';

// Importing the server side modules.
import testFile from '../server-controllers/test';
import db from '../server-controllers/database';
import buildQuery from '../server-controllers/buildQuery';

const router = express.Router();

// authenticate our router
auth.authenticate(router);

router.get('/', (req, res) => {
  res.render('index');
});

// index route
router.get('/about', (req, res) => {
  testFile.test().then((data) => {
    return res.render('about', {
      title: data,
    });
  }).catch((e) => {
    res.status(500, {
      error: e,
    });
  });
});

router.get('/StatusEntry', (req, res) => {
  res.render('StatusEntry', { route: 'StatusEntry' });
});

router.get('/StatusEntry2', (req, res) => {
  res.render('StatusEntry2', { route: 'StatusEntry2' });
});

router.get('/getTable', (req, res) => {
  const tables = ['action', 'action_type', 'area', 'disposition_type', 'isr_package_task',
    'paciv_report', 'package', 'package_type', 'prequote', 'tag', 'task'];
  if (typeof req.query.table !== 'string' || tables.indexOf(req.query.table) === -1) { res.send('{ "err": "invalid table name" }'); return; }
  const sql = `SELECT * from ie43t2.${req.query.table};`;
  db.query(sql, [], (err, res2) => {
    if (err) {
      console.log(`Callback error: ${err}`);
      res.status(500);
      res.json({});
    } else {
      res.json(res2);
    }
  });
});

router.get('/getActions', (req, res) => {
  const actionTypes = ['prequote', 'technical', 'RFP', 'PO'];
  if (typeof req.query.actionType !== 'string' || actionTypes.indexOf(req.query.actionType) === -1) {
    res.send('{ "err": "invalid action type" }');
    return;
  }
  let sql;
  switch (req.query.actionType) {
  case 'prequote':
    sql = `select idaction, package_idpackage, DATE_FORMAT(action_start,'%Y-%m-%d') as action_start,
           act_count, revision, reviewer, DATE_FORMAT(action_end,'%Y-%m-%d') as action_end,
           disposition_type_iddisposition_type, hours
        from action where action_type_idaction_type = 1 order by action_start asc;`;
    break;
  case 'technical':
    sql = `select idaction, package_idpackage, DATE_FORMAT(action_start,'%Y-%m-%d') as action_start,
           act_count, revision, reviewer, DATE_FORMAT(action_end,'%Y-%m-%d') as action_end,
           disposition_type_iddisposition_type, hours
        from action where action_type_idaction_type = 2 order by action_start asc;`;
    break;
  case 'RFP':
    sql = `select idaction, package_idpackage, DATE_FORMAT(action_start,'%Y-%m-%d') as action_start,
           act_count, revision, product_cost, document_cost, transportation_cost
        from action where action_type_idaction_type = 3 order by action_start asc;`;
    break;
  case 'PO':
    sql = `select idaction, package_idpackage, DATE_FORMAT(action_start,'%Y-%m-%d') as action_start,
           act_count, revision
        from action where action_type_idaction_type = 4 order by action_start asc;`;
    break;
  default:
  }
  db.query(sql, [], (err, res2) => {
    if (err) {
      console.log(`Callback error: ${err}`);
      res.status(500);
      res.json({});
    } else {
      res.json(res2);
    }
  });
});

// Put request to insert or update item in database
// post body should be in form {"table": "action", "data": { "foreignkey": 1, "field": null}}
router.post('/changeAction', (req, res) => {
  if (typeof req.body.table === 'string' && req.body.table === 'action' && // validate POST body
    typeof req.body.data === 'object') {
    // TODO: validate and clean input from webpage
    const sql = buildQuery('action', 'idaction', req.body.data);
    db.query(sql, [], (err, res2) => {
      if (err) {
        console.log(`Callback error: ${err}`);
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
  db.query(sql, [], (err, res2) => {
    status.count--;
    status.results.push(res2);
    if (err) status.success = false;
    if (status.count === 0) { // all queries have returned
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
router.post('/deleteAction', (req, res) => {
  if (typeof req.body.table === 'string' && req.body.table === 'action' && // validate POST body
    typeof req.body.data === 'object') {
    // TODO: validate and clean input from webpage
    const mStat = { count: req.body.data.ids.length, res, success: true, results: [] };
    for (let i = 0; i < req.body.data.ids.length; i++) {
      const sql = `DELETE FROM ${req.body.table} WHERE ${req.body.data.key}='${req.body.data.ids[i]}';`;
      multiQuery(sql, mStat);
    }
  } else {
    res.status(500);
    res.json({ error: 'Invalid POST format' });
  }
});

module.exports = router;
