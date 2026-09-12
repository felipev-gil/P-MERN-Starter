import mongoose from "mongoose";
export async function connectDatabase(uri) {
  mongoose.set("bufferCommands", false);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch {
    throw new Error(
      "Database connection failed. Check MONGO_URI, MongoDB availability, credentials, and network access.",
    );
  }
}
