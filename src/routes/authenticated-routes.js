// Routes in this module require authentication
import express from 'express';

// Importing authentication flow
import auth from 'cirrus-auth-module';

// Importing the server side modules.
import testFile from '../server-controllers/test';

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

module.exports = router;
