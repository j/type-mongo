import { Collection, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generate } from 'shortid';

const mongoServer = new MongoMemoryServer();
let cache: MongoClient;

export async function createClient(): Promise<MongoClient> {
  const uri = await mongoServer.getConnectionString();

  if (!cache) {
    cache = await MongoClient.connect(uri);
  }

  return cache;
}

export async function getCollection(name?: string): Promise<Collection> {
  const client = await createClient();

  const random = generate();

  const db = client.db(`test_${random}`);

  return db.collection(name || `collection_${random}`);
}
