const logger = require('../logger');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB est connecté à Atlas');
    console.log('MongoDB est connecté à Atlas');
  } catch (err) {
    logger.error(`Erreur de connexion à MongoDB: ${err.message}`);
    console.error('Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
