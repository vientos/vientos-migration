const fs = require('fs')
const statesGeojsons = JSON.parse(fs.readFileSync('data/states.json', 'utf8'))
const municipalitiesGeojsons = JSON.parse(fs.readFileSync('data/municipalities.json', 'utf8'))
const MongoClient = require('mongodb').MongoClient
const cuid = require('cuid')
const turf = require('@turf/turf')
const URL_PREFIX = process.env.URL_PREFIX || 'http://localhost:3000'
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'vientos-dev'
let codesMap = {}

function getCenter (geometry) {
  let shape = geometry.type === 'Polygon'
  ? turf.polygon(geometry.coordinates)
  : turf.multiPolygon(geometry.coordinates)
  return turf.centroid(shape).geometry.coordinates
}

let states = statesGeojsons.features.map(feature => {
  let url = `${URL_PREFIX}/places/${cuid()}`
  let name = feature.properties.state_name
  codesMap[feature.properties.state_code] = url
  let [longitude, latitude] = getCenter(feature.geometry)
  let bbox = turf.bbox(feature.geometry)
  return {
    _id: url,
    type: 'Place',
    name,
    address: name,
    latitude,
    longitude,
    bbox: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    },
    level: 'state'
  }
})

let municipalities = municipalitiesGeojsons.features.map(feature => {
  let state = states.find(s => s._id === codesMap[feature.properties.state_code])
  let name = feature.properties.mun_name
  let [longitude, latitude] = getCenter(feature.geometry)
  let bbox = turf.bbox(feature.geometry)
  return {
    _id: `${URL_PREFIX}/places/${cuid()}`,
    type: 'Place',
    name,
    address: `${name}, ${state.name}`,
    state: state._id,
    latitude,
    longitude,
    bbox: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    },
    level: 'municipality'
  }
})

MongoClient.connect(MONGO_URL)
.then(client => {
  client.db(MONGO_DB_NAME).collection('states').insert(states)
  client.db(MONGO_DB_NAME).collection('municipalities').insert(municipalities)
  client.close()
})
