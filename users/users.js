const router = require('express').Router()
const cors = require('cors')
const sec = require('../security/bearer')
const db = require('../dal/database')
const crypto = require('crypto');
const {
  v4: guid
} = require('uuid/dist/')

router.use(cors())

router.get('/', sec.validate, (req, res) => {
  let sql = `
    SELECT * FROM usuarios`
  db.query(sql, (err, results) => {
    if (err) res.json(err);
    return res.json(results);
  })
})

router.post('/', (req, res) => {
  try {
    let nombre = req.body.nombre;
    let apellido = req.body.apellido;
    let email = req.body.email;
    let password = crypto.createHash('sha256').update(req.body.password).digest('base64');
    let fecha_nacimiento = req.body.fecha_nacimiento;

    let sql = `
    INSERT INTO usuarios SET ?`;

    db.query(sql, {
      nombre,
      apellido,
      email,
      password,
      fecha_nacimiento
    }, (err, results) => {
      if (err) return res.status(500).json(err);
      return res.json(results);
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

router.get('/:id', sec.validate, (req, res) => {
  try {
    let id = req.params.id;
    let sql = `
    SELECT nombre, apellido, fecha_nacimiento, email FROM usuarios WHERE id = ?`

    db.query(sql, [id], (error, results) => {
      if (error) {
        return res.status(500).json({
          error
        })
      }

      if (!(results.length > 0)) {
        return res.json({
          message: 'Usuario no encontrado'
        })
      } else {
        return res.json(results[0]);
      }
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

router.put('/:id', sec.validate, (req, res) => {
  try {
    let sql = `
    UPDATE usuarios
    SET nombre = ?, apellido = ?, fecha_nacimiento = ?, email = ?
    WHERE id = ?`
    let id = req.params.id;
    let user = req.body.user;

    db.query(sql, [user.nombre, user.apellido, user.fecha_nacimiento, user.email, , id], (error, result) => {
      if (error) {
        return res.status(500).json({
          error
        })
      }

      return res.json({
        result
      })
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

router.post('/password-change-request', (req, res) => {
  try {
    let sql = `
    SELECT id, email
    FROM usuarios
    WHERE email = ?`
    let email = req.body.email;

    db.query(sql, [email], (error, result) => {
      if (error) {
        return res.status(500).json({
          error
        })
      }

      if (result.length == 0) {
        return res.json({
          message: 'Usuario no encontrado'
        })
      } else {
        let user = result[0];
        sql = `
        INSERT INTO tokens_cambio_passwords
        (usuario_id, token, fecha_expiracion)
        VALUES
        (?, ?, ?)`

        let token = guid();
        let expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + 30 * 1000)

        db.query(sql, [user.id, token, expirationDate], (err, result) => {
          if (err) {
            return res.status(500).json({
              error
            })
          }

          return res.json({
            token,
            expirationDate
          })
        })
      }
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

router.put('/:id/change-password', (req, res) => {
  try {
    let id = req.params.id;
    let token = req.body.token;

    let sql = `
    SELECT id, usuario_id, token, fecha_expiracion, expirado
    FROM tokens_cambio_passwords
    WHERE usuario_id = ?
      AND expirado = 0`

    db.query(sql, [id], (error, results) => {
      if (error) {
        return res.status(500).json({
          error
        })
      }

      if (results.length == 0) {
        return res.status(403).json({
          message: 'No se encontró el token o ya expiró'
        })
      }

      let validToken = false;
      let tokenId = -1;
      results.forEach(r => {
        if (r.token == token) {
          let fechaExpiracion = new Date(r.fecha_expiracion)
          let now = new Date();
          console.log(JSON.stringify(r));
          if (now < fechaExpiracion) {
            tokenId = r.id;
            validToken = true;
          }
        }
      })

      if (!validToken) {
        return res.status(403).json({
          message: 'No se encontró el token o ya expiró'
        })
      }

      sql = `
      UPDATE usuarios
      SET password = ?
      WHERE id = ?`
      let password = crypto.createHash('sha256').update(req.body.password).digest('base64');

      db.query(sql, [password, id], (error, result) => {
        if (error) {
          return res.status(500).json({
            error
          })
        }

        sql = `
        UPDATE tokens_cambio_passwords
        SET expirado = 1
        WHERE id = ?`

        console.log(sql.replace('?', tokenId));

        db.query(sql, [tokenId], (error, result) => {
          if (error) {
            return res.status(500).json({
              error
            })
          }

          return res.json({
            result
          })
        })
      })
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

router.delete('/:id', sec.validate, (req, res) => {
  try {
    let sql = `
    DELETE FROM usuarios
    WHERE id = ?`
    let id = req.params.id;

    db.query(sql, [id], (error, result) => {
      if (error) {
        return res.status(500).json({
          error
        })
      }

      return res.json({
        result
      })
    })
  } catch (e) {
    return res.status(500).json({
      name: e.name,
      message: e.message
    })
  }
})

module.exports = router