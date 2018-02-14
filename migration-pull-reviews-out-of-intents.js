const { MongoClient } = require('mongodb')

;(async () => {
  const client = await MongoClient.connect(process.env.MONGO_URL)
  const db = client.db(process.env.MONGO_DB_NAME)
  const conversations = await db.collection('conversations').find({}).toArray()
  await Promise.all(conversations.map(conversation => {
    if (conversation.reviews.length === 0) return Promise.resolve()
    return Promise.all(conversation.reviews.map(review => {
      return db.collection('reviews').insertOne(review)
    }))
  }))
  await Promise.all(conversations.map(conversation => {
    delete conversation.reviews
    return db.collection('conversations').replaceOne({ _id: conversation._id }, conversation)
  }))
  client.close()
})()
