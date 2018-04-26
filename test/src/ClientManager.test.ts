import { test } from 'ava';
import { ClientManager } from '../../src/ClientManager';
import { createClient } from '../util';

test('ConnectionManager.getCollection() uses the default client & database', async t => {
  const client = await createClient();
  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test' });

  await client
    .db('test')
    .collection('foo')
    .insertOne({ foo: 'bar' });

  const foo = clientManager.getCollection('foo');

  t.is(foo.collectionName, 'foo');

  const found = await foo.findOne({ foo: 'bar' });

  t.deepEqual(found.foo, 'bar');
});

test('ConnectionManager.getCollection() uses the default client & other database', async t => {
  const client = await createClient();
  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test' });

  await client
    .db('test_other')
    .collection('bar')
    .insertOne({ bar: 'baz' });

  const bar = clientManager.getCollection('bar', {
    databaseName: 'test_other'
  });

  t.is(bar.collectionName, 'bar');

  const found = await bar.findOne({ bar: 'baz' });

  t.deepEqual(found.bar, 'baz');
});

test('ConnectionManager.getCollection() uses other client & default database', async t => {
  const secondClient = await createClient();
  const clientManager = new ClientManager();

  // default client
  clientManager.registerClient(await createClient(), {
    defaultDatabase: 'test'
  });

  // second client
  clientManager.registerClient(secondClient, {
    defaultDatabase: 'test_second',
    name: 'second'
  });

  await secondClient
    .db('test_second')
    .collection('test_second_collection')
    .insertOne({ test_second_collection: 'test_second_collection_value' });

  const collection = clientManager.getCollection('test_second_collection', {
    clientName: 'second'
  });

  t.is(collection.collectionName, 'test_second_collection');

  const found = await collection.findOne({
    test_second_collection: 'test_second_collection_value'
  });

  t.deepEqual(found.test_second_collection, 'test_second_collection_value');
});

test('ConnectionManager.getCollection() uses other client & other database', async t => {
  const secondClient = await createClient();
  const clientManager = new ClientManager();

  // default client
  clientManager.registerClient(await createClient(), {
    defaultDatabase: 'test'
  });

  // second client
  clientManager.registerClient(secondClient, {
    defaultDatabase: 'test_second',
    name: 'second'
  });

  await secondClient
    .db('test_second_other')
    .collection('test_second_other_collection')
    .insertOne({
      test_second_other_collection: 'test_second_other_collection_value'
    });

  const collection = clientManager.getCollection(
    'test_second_other_collection',
    {
      clientName: 'second',
      databaseName: 'test_second_other'
    }
  );

  t.is(collection.collectionName, 'test_second_other_collection');

  const found = await collection.findOne({
    test_second_other_collection: 'test_second_other_collection_value'
  });

  t.deepEqual(
    found.test_second_other_collection,
    'test_second_other_collection_value'
  );
});
