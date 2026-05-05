const express = require('express')
const formidable = require('formidable')
const path = require('node:path')
const fs = require('node:fs')

const folder = path.normalize(__dirname + '../../DataTable')

async function uploadCSV(req, res, next) {
  console.log('uploadCSV')

  if (!fs.existsSync(folder)) {
    throw new global.ErrorTypes.InternalServerError()
  }

  const form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.uploadDir = folder
  form.multiples = true
  form.keepExtentions = true;

  try {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(err)
        throw new global.ErrorTypes.ConflictError()
      }

      for (let key in files) {
        const fileName = path.join(folder, key)
        fs.renameSync(files[key][0].filepath, fileName)
      }
      res.status(200).send({data:Object.keys(files), message: "모든데니터를 성공적으로 업로드하였습니다."})
    })
  } catch(err) {
    throw new Error(err)
  }
}

module.exports = { uploadCSV }