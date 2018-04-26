import { test } from 'ava';
import { MongoClient, ObjectID } from 'mongodb';
import { ClientManager, Document, Field, Repository } from '../../../src';
import { createClient } from '../../util';

@Document({ collectionName: 'users' })
class User {
  @Field() public _id: ObjectID;

  @Field() public firstName: string;

  @Field() public lastName: string;

  get id(): string {
    return this._id.toHexString();
  }
}

const fixtures = [
  {
    _id: new ObjectID('507f1f77bcf86cd799439011'),
    firstName: 'Jordy',
    lastName: 'Smith'
  },
  {
    _id: new ObjectID('507f191e810c19729de860ea'),
    firstName: 'Kelly',
    lastName: 'Slater'
  }
];

async function prepareFixtures(
  client: MongoClient,
  databaseName: string
): Promise<void> {
  await client
    .db(databaseName)
    .collection('users')
    .insertMany(fixtures);
}

test('Repository.count()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_count' });

  await prepareFixtures(client, 'test_count');

  const repository = new Repository(User, clientManager);

  t.is(await repository.count({}), 2);
  t.is(await repository.getCollection().count({ firstName: 'Jordy' }), 1);
});

test('Repository.deleteMany()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_deleteMany' });

  await prepareFixtures(client, 'test_deleteMany');

  const repository = new Repository(User, clientManager);

  t.is(await repository.getCollection().count({}), 2);
  await repository.deleteMany({});
  t.is(await repository.getCollection().count({}), 0);
});

test('Repository.deleteOne()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_deleteOne' });

  await prepareFixtures(client, 'test_deleteOne');

  const repository = new Repository(User, clientManager);

  t.is(await repository.getCollection().count({}), 2);
  await repository.deleteOne({ firstName: 'Jordy' });
  t.is(await repository.getCollection().count({}), 1);
});

test('Repository.save()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_insertOne' });

  const repository = new Repository(User, clientManager);

  const user = new User();
  user.firstName = 'John';
  user.lastName = 'Doe';

  const inserted = await repository.save(user);

  t.true(user === inserted);
  t.true(user._id instanceof ObjectID);
  t.is(user.firstName, 'John');
  t.is(user.lastName, 'Doe');
});

test('Repository.findOneAndUpdate()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: 'test_findOneAndUpdate'
  });

  await prepareFixtures(client, 'test_findOneAndUpdate');

  const repository = new Repository(User, clientManager);

  const updated = await repository.findOneAndUpdate(
    { _id: new ObjectID('507f1f77bcf86cd799439011') },
    { $set: { firstName: 'Jordy Updated' } }
  );

  t.true(updated instanceof User);
  t.true(updated._id instanceof ObjectID);
  t.is(updated._id.toHexString(), '507f1f77bcf86cd799439011');
  t.is(updated.firstName, 'Jordy Updated');
  t.is(updated.lastName, 'Smith');
});

test('Repository.findOneAndUpdate() when not found', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: 'test_findOneAndUpdate_not_found'
  });

  await prepareFixtures(client, 'test_findOneAndUpdate_not_found');

  const repository = new Repository(User, clientManager);

  const updated = await repository.findOneAndUpdate(
    { _id: new ObjectID('5acd2f7be2f6ee1560b53152') },
    { $set: { firstName: 'Some', lastName: 'User' } }
  );

  t.is(updated, null);
});

test('Repository.findOneAndUpdate() upserts when not found', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: 'test_findOneAndUpdate_upserts_not_found'
  });

  await prepareFixtures(client, 'test_findOneAndUpdate_upserts_not_found');

  const repository = new Repository(User, clientManager);

  const created = await repository.findOneAndUpdate(
    { _id: new ObjectID('5acd2f7be2f6ee1560b53152') },
    { $set: { firstName: 'Some', lastName: 'User' } },
    { upsert: true }
  );

  t.true(created instanceof User);
  t.true(created._id instanceof ObjectID);
  t.is(created._id.toHexString(), '5acd2f7be2f6ee1560b53152');
  t.is(created.firstName, 'Some');
  t.is(created.lastName, 'User');
});

test('Repository.findOne()', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_findOne' });

  await prepareFixtures(client, 'test_findOne');

  const repository = new Repository(User, clientManager);

  const foundUser = await repository.findOne({ firstName: 'Jordy' });

  t.true(foundUser instanceof User);
  t.true(foundUser._id instanceof ObjectID);
  t.is(foundUser._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUser.id, foundUser._id.toHexString());
  t.is(foundUser.firstName, 'Jordy');
  t.is(foundUser.lastName, 'Smith');
});

test('Repository.findOne() returns null when not found', async t => {
  const client = await createClient();

  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: 'test_findOne_returns_null'
  });

  await prepareFixtures(client, 'test_findOne_returns_null');

  const repository = new Repository(User, clientManager);

  t.is(await repository.findOne({ firstName: 'NotFound' }), null);
});

test('Repository.find()', async t => {
  const client = await createClient();
  const clientManager = new ClientManager();
  clientManager.registerClient(client, { defaultDatabase: 'test_find' });

  await prepareFixtures(client, 'test_find');

  const repository = new Repository(User, clientManager);

  const foundUsers = await repository
    .find()
    .sort({ firstName: 1 })
    .toArray();

  t.is(foundUsers.length, 2);
  t.true(foundUsers[0] instanceof User);
  t.true(foundUsers[0]._id instanceof ObjectID);
  t.is(foundUsers[0]._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUsers[0].id, fixtures[0]._id.toHexString());
  t.is(foundUsers[0].firstName, 'Jordy');
  t.is(foundUsers[0].lastName, 'Smith');
  t.true(foundUsers[1] instanceof User);
  t.true(foundUsers[1]._id instanceof ObjectID);
  t.is(foundUsers[1]._id.toHexString(), fixtures[1]._id.toHexString());
  t.is(foundUsers[1].id, fixtures[1]._id.toHexString());
  t.is(foundUsers[1].firstName, 'Kelly');
  t.is(foundUsers[1].lastName, 'Slater');
});

test('Repository.find() with query', async t => {
  const client = await createClient();
  const clientManager = new ClientManager();
  clientManager.registerClient(client, {
    defaultDatabase: 'test_find_with_query'
  });

  await prepareFixtures(client, 'test_find_with_query');

  const repository = new Repository(User, clientManager);

  const foundUsers = await repository.find({ _id: fixtures[0]._id }).toArray();

  t.is(foundUsers.length, 1);
  t.true(foundUsers[0] instanceof User);
  t.true(foundUsers[0]._id instanceof ObjectID);
  t.is(foundUsers[0]._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUsers[0].id, fixtures[0]._id.toHexString());
  t.is(foundUsers[0].firstName, 'Jordy');
  t.is(foundUsers[0].lastName, 'Smith');
});
