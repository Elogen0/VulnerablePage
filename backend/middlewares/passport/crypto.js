const crypto = require('crypto')

function createSalt() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (err) reject(err)
      resolve(buf.toString("base64"))
    })
  })
}

exports.createCryptoPassword = async (plainPassword) => {
  const salt = await createSalt()
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(plainPassword, salt, 100000, 64, "sha512", (err, key) => {
      if (err) reject(err)
      resolve({ password: key.toString("base64"), salt})
    })
  })
}

exports.getCryptoPassword = (plainPassword, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(plainPassword, salt, 100000, 64, "sha512", (err, key) => {
      if (err) reject(err)
      resolve(key.toString("base64"))
    })
  })
}
