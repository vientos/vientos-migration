const { MongoClient } = require('mongodb')

;(async () => {
  const client = await MongoClient.connect(process.env.MONGO_URL)
  const db = client.db(process.env.MONGO_DB_NAME)
  const projects = await db.collection('projects').find({}).toArray()
  await Promise.all(projects.map(project => {
    if (project.locations.length === 0) {
      project.locations = [process.env.DEFAULT_PLACE_URL]
      return db.collection('projects').replaceOne({ _id: project._id }, project)
    } else {
      return Promise.resolve()
    }
  }))
  client.close()
})()
