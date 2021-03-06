var fs = require('fs')
var request = require('request')
var mkdirp = require('mkdirp')
var run = require('run-parallel-limit')
var moment = require('moment-timezone')
var download = require('./download.js')

var headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36'}
mkdirp.sync('./tmp')

// get latest timestamp
request('http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor/latest_times.json', {json: true, headers: headers}, function (err, resp, json) {
  var today = json.timestamps_int[0].toString().slice(0, 8)
  // use latest to generate last 2 days
  var days = [
    today,
    moment(today).subtract(1, 'days').format('YYYYMMDD')
  ]
  var timestamps = []
  // get all 15 min timestamps for last 3 days
  var fns = days.map(function (d) {
    return function (cb) {
      request(`http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor/${d}_by_hour.json`, {json: true, headers: headers}, function (err, resp, json) {
        Object.keys(json.timestamps_int).forEach(function (i) {
          timestamps = timestamps.concat(json.timestamps_int[i])
        })
        cb()
      })
    }
  })
  run(fns, 1, function () {
    getTimestamps(timestamps)
  })
})

// download all west coast tiles for last 3 days
function getTimestamps (timestamps) {
  var queue = []
  timestamps.forEach(function (stamp) {
    var date = stamp.toString().slice(0, 8)
    var tiles = ['001_003', '001_004', '001_005', '002_003', '002_004', '002_005', '003_003', '003_004', '003_005']
    tiles.map(function (t) {
      var item = {}
      item.url = `http://rammb-slider.cira.colostate.edu/data/imagery/${date}/goes-16---full_disk/geocolor/${stamp}/04/${t}.png`
      item.filename = `./images/${stamp}/${t}.png`
      item.stamp = stamp
      item.date = date
      var fn = function (cb) {
        download(item.url, {headers: headers}, item.filename, cb)
      }
      var closure = (function (item) { return fn })(item)
      queue.push(closure)
    })
  })
  run(queue, 5, function (err) {
    console.log('done', err)
  })
}