import { MongoClient } from 'mongodb';
import { ClientManager, ClientOpts } from './ClientManager';
import { TypedConstructor } from './common/TypedConstructor';
import { Repository } from './repository/Repository';

export { ClientManager } from './ClientManager';
export { Repository } from './repository/Repository';
export { classToDocument } from './serializers/classToDocument';
export { documentToClass } from './serializers/documentToClass';
export * from './decorators';

const clientManager = new ClientManager();

export async function connect(uri: string, opts: ClientOpts) {
  const client = await MongoClient.connect(uri);

  clientManager.registerClient(client, opts);
}

export function createRepository<T>(
  Document: TypedConstructor<T>
): Repository<T> {
  return new Repository(Document, clientManager);
}
