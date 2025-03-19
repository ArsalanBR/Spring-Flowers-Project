// dbconfig.js

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    db = client.db('blueflowersgallery');
    console.log("Successfully connected to MongoDB!"); // Confirm connection success
  } catch (err) {
    console.error('Failed to connect to MongoDB', err); // Log error message
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { connectDB, getDB };
