const router = require('express').Router();
const cors = require('cors');
const db = require('../dal/database');
const sec = require('../security/bearer')
const crypto = require('crypto');

router.use(cors())

router.post('/', (req, res) => {
  let email = req.body.email;
  let password = crypto.createHash('sha256').update(req.body.password).digest('base64');
  let sql = 'SELECT email, password FROM usuarios WHERE email = ?'

  db.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).json({
        error: err
      });
    } else {
      if (results.length > 0 && results[0].password == password) {
        let user = results[0]
        let token = sec.create(user);

        return res.json({
          message: 'Login successfull.',
          token
        })
      } else {
        return res.status(401).json({
          message: 'Username and password do not match.'
        })
      }
    }

  })
})

module.exports = router