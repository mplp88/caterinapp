const db = require('../dal/database');
const jwt = require('jsonwebtoken')

const bearerKey = process.env.BEARER_KEY

const bearer = {
  create(user, expiration) {
    let payload = {
      user
    }
    let token = jwt.sign(payload, bearerKey + user.email, {
      expiresIn: expiration || "1 day"
    })

    return token;
  },
  validate(req, res, next) {
    let auth = req.headers.authorization;

    if (!auth || !(req.body && req.body.user && req.body.user.email)) {
      res.sendStatus(401);
    } else {
      let temp = auth.split(' ');
      let token = temp[1];
      try {
        jwt.verify(token, bearerKey + req.body.user.email);
        next();
      } catch (e) {
        res.sendStatus(401);
      }
    }
  }
}

module.exports = bearer;