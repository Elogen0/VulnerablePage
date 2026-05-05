'use strict'

const xlsx = require('xlsx')
const path = require('path')
const appRoot = require('app-root-path')

class Exl {
  constructor() {
    if (!Exl.instance) {
      Exl.instance = this

      //read exel files
    }
  }

  loadAll() {
    let success = true
    console.log('~~~load exel data~~~')
    try {
      this.items = this.convertToMap(this.load('Item'), 'Item_ID')
    } catch (err) {
      success = false
    }
    console.log('~~~load excel end~~~')
    return success
  }

  load(filename) {
    const dir = path.normalize(appRoot + '/datas/' + filename + '.csv')
    console.log('[load data file]:' + dir)
    return xlsx.readFile(dir)
  }

  convertToMap(workbook, keyColumnName) {
    let arr = xlsx.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]])
    return arr.reduce((map, obj) => {
      map[obj[keyColumnName]] = obj
      return map
    }, new Map)
  }
}

const exl = new Exl()
Object.freeze(exl)

module.exports = exl