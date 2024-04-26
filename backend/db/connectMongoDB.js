import mongoose from "mongoose";

const connectMongoDB = () => {
  try {
    const conn = mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected!`);
  } catch (error) {
    console.log(`Error Connecting to mongoDB : ${error.message}`);
    process.exit(1);
  }
};

export default connectMongoDB;
