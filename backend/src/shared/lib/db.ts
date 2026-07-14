import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  return uri;
}

// @ts-ignore
global.__mongooseConn = global.__mongooseConn || { conn: null, promise: null };

export async function connectToDB() {
  // @ts-ignore
  if (global.__mongooseConn.conn) return global.__mongooseConn.conn;
  // @ts-ignore
  if (!global.__mongooseConn.promise) {
    // @ts-ignore
    global.__mongooseConn.promise = mongoose
      .connect(getMongoUri())
      .then((m) => {
        // @ts-ignore
        global.__mongooseConn.conn = m;
        return m;
      });
  }
  // @ts-ignore
  return global.__mongooseConn.promise;
}
