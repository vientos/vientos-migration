const { MongoClient } = require('mongodb')

;(async () => {
  const client = await MongoClient.connect(process.env.MONGO_URL)
  const db = client.db(process.env.MONGO_DB_NAME)
  const intents = await db.collection('intents').find({}).toArray()
  const conversations = await db.collection('conversations').find({}).toArray()
  await Promise.all(conversations.map(conversation => {
    if (conversation.reviews.length === 0) return Promise.resolve()
    conversation.reviews.forEach(review => {
      review.causingIntent = conversation.causingIntent
      if (conversation.matchingIntent) {
        review.matchingIntent = conversation.matchingIntent
      }
    })
    return db.collection('conversations').replaceOne({ _id: conversation._id }, conversation)
  }))
  await Promise.all(intents.map(intent => {
    delete intent.openConversations
    delete intent.abortedConversations
    delete intent.successfulConversations
    return db.collection('intents').replaceOne({ _id: intent._id }, intent)
  }))
  client.close()
})()
