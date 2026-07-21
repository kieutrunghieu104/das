import mongoose from "mongoose";
import { env } from "./environment.js";
import { COLLECTION_INDEXES, MODELS } from "../models/index.js";
import "../models/index.js";

let database;

export async function connectMongoDB(uri = env.MONGODB_URI) {
  if (!uri) {
    throw new Error("Thiếu chuỗi kết nối MongoDB.");
  }

  if (database) {
    return database;
  }

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
  database = mongoose.connection.db;
  await ensureIndexes(database);
  return database;
}

async function ensureIndexes(db) {
  await Promise.all(
    Object.entries(COLLECTION_INDEXES).flatMap(([collectionName, indexes]) =>
      indexes.map(async ({ key, options }) => {
        try {
          await db.collection(collectionName).createIndex(key, options);
        } catch (error) {
          if (
            [85, 86].includes(error.code) &&
            collectionName === "treatmentrecords" &&
            key.appointment === 1 &&
            options?.partialFilterExpression
          ) {
            try {
              await db.collection(collectionName).dropIndex("appointment_1");
            } catch (dropError) {
              if (dropError.codeName !== "IndexNotFound") throw dropError;
            }
            await db.collection(collectionName).createIndex(key, options);
            return;
          }
          if (![85, 86].includes(error.code)) throw error;
        }
      })
    )
  );
}

export function getDatabase() {
  if (!database) {
    throw new Error("MongoDB chưa được kết nối.");
  }
  return database;
}

export function getModel(name) {
  const model = MODELS[name];
  if (!model) {
    throw new Error(`Không tìm thấy model Mongoose cho collection ${name}.`);
  }
  return model;
}

export function getCollection(name) {
  getDatabase();
  return getModel(name).collection;
}

export function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return value;
}

export function isObjectId(value) {
  return value instanceof mongoose.Types.ObjectId || (typeof value === "string" && mongoose.Types.ObjectId.isValid(value));
}

export async function closeMongoDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  database = undefined;
}
