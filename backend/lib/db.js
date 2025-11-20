import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async (uri) => {
  if (isConnected) {
    // Using existing database connection
    return;
  }

  try {
    // Enable strict mode for queries
    mongoose.set('strictQuery', true);
    
    const connection = await mongoose.connect(uri, {
      dbName: 'PollingApp',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    // MongoDB Connected: ${connection.connection.host}
    
    // Log any errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    // Log when the connection is disconnected
    mongoose.connection.on('disconnected', () => {
      // MongoDB disconnected
      isConnected = false;
    });

    // Close the Mongoose connection when the Node process ends
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      // MongoDB connection closed due to app termination
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};