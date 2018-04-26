import { Collection, MongoClient } from 'mongodb';

export interface ClientOpts {
  name?: string;
  defaultDatabase: string;
}

interface ClientConfig extends ClientOpts {
  client: MongoClient;
  collectionCache: { [key: string]: Collection };
}

export class ClientManager {
  private clients: { [name: string]: ClientConfig } = {};

  public registerClient(client: MongoClient, opts: ClientOpts): this {
    if (!opts.name) {
      opts.name = 'default';
    }

    if (this.clients[opts.name]) {
      throw new Error(`Client with name "${opts.name}" already exists.`);
    }

    this.clients[opts.name] = {
      ...opts,
      client,
      collectionCache: {}
    };

    return this;
  }

  public getCollection(
    collectionName: string,
    opts: { clientName?: string; databaseName?: string } = {}
  ): Collection {
    const { databaseName, clientName } = this.getOpts(opts);

    const clientConfig = this.clients[clientName];

    const cacheKey = `${clientName}.${databaseName}.${collectionName}`;

    if (!this.clients[clientName].collectionCache[cacheKey]) {
      clientConfig.collectionCache[cacheKey] = clientConfig.client
        .db(databaseName)
        .collection(collectionName);
    }

    return clientConfig.collectionCache[cacheKey];
  }

  private getOpts(opts: {
    clientName?: string;
    databaseName?: string;
  }): { clientName: string; databaseName: string } {
    const clientName = opts.clientName || 'default';

    this.assertClientExists(clientName);

    return {
      clientName,
      databaseName:
        opts.databaseName || this.clients[clientName].defaultDatabase
    };
  }

  private assertClientExists(clientName: string): void {
    if (!this.clients[clientName]) {
      throw new Error(`Client with name "${clientName}" does not exist.`);
    }
  }
}
