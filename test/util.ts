import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generate } from 'shortid';
import { ClientManager } from '../src/ClientManager';

const mongoServer = new MongoMemoryServer();
let cache: MongoClient;

export async function createClient(): Promise<MongoClient> {
  const uri = await mongoServer.getConnectionString();

  if (!cache) {
    cache = await MongoClient.connect(uri);
  }

  return cache;
}

export function createClientManager(client: MongoClient): ClientManager {
  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: `test_${generate()}`
  });

  return clientManager;
}
