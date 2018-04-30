import { test } from 'ava';
import { Collection, ObjectID } from 'mongodb';
import { Document, Field } from 'type-mongo-mapper';
import { Repository } from '../../src/Repository';
import { getCollection } from '../testUtils';

@Document()
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

async function prepareFixtures(collection: Collection): Promise<void> {
  await collection.insertMany(fixtures);
}

test('Repository.count()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.count({}), 2);
  t.is(await repository.getCollection().count({ firstName: 'Jordy' }), 1);
});

test('Repository.deleteMany()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.getCollection().count({}), 2);
  await repository.deleteMany({});
  t.is(await repository.getCollection().count({}), 0);
});

test('Repository.deleteOne()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.getCollection().count({}), 2);
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    1
  );
  await repository.deleteOne({ firstName: 'Jordy' });
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    0
  );
  t.is(await repository.getCollection().count({}), 1);
});

test('Repository.deleteOneById() when id as string', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.getCollection().count({}), 2);
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    1
  );
  await repository.deleteOneById('507f1f77bcf86cd799439011');
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    0
  );
  t.is(await repository.getCollection().count({}), 1);
});

test('Repository.deleteOneById() when id as ObjectID', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.getCollection().count({}), 2);
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    1
  );
  await repository.deleteOneById(new ObjectID('507f1f77bcf86cd799439011'));
  t.is(
    await collection.count({ _id: new ObjectID('507f1f77bcf86cd799439011') }),
    0
  );
  t.is(await repository.getCollection().count({}), 1);
});

test('Repository.save() creates a new user', async t => {
  const collection = await getCollection();
  const repository = new Repository(User, collection);

  const user = new User();
  user.firstName = 'John';
  user.lastName = 'Doe';

  t.is(await collection.count({}), 0);
  const inserted = await repository.save(user);
  t.is(await collection.count({}), 1);

  t.true(user === inserted);
  t.true(user._id instanceof ObjectID);
  t.is(user.firstName, 'John');
  t.is(user.lastName, 'Doe');
});

test('Repository.save() updates a user', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const user = new User();
  user._id = new ObjectID('507f1f77bcf86cd799439011');
  user.firstName = 'Jordy Updated';
  user.lastName = 'Smith Updated';

  t.is(await collection.count({}), 2);
  const updated = await repository.save(user);
  t.is(await collection.count({}), 2);

  t.true(user === updated);
  t.true(user._id instanceof ObjectID);
  t.is(user.id, '507f1f77bcf86cd799439011');
  t.is(user.firstName, 'Jordy Updated');
  t.is(user.lastName, 'Smith Updated');
});

test('Repository.create()', async t => {
  const collection = await getCollection();

  const repository = new Repository(User, collection);

  t.is(await collection.count({}), 0);
  const user = await repository.create({ firstName: 'John', lastName: 'Doe' });
  t.is(await collection.count({}), 1);

  t.true(user._id instanceof ObjectID);
  t.is(user.firstName, 'John');
  t.is(user.lastName, 'Doe');
});

test('Repository.findOneAndUpdate()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await collection.count({}), 2);
  const updated = await repository.findOneAndUpdate(
    { _id: new ObjectID('507f1f77bcf86cd799439011') },
    { $set: { firstName: 'Jordy Updated' } }
  );
  t.is(await collection.count({}), 2);

  t.true(updated instanceof User);
  t.true(updated._id instanceof ObjectID);
  t.is(updated._id.toHexString(), '507f1f77bcf86cd799439011');
  t.is(updated.firstName, 'Jordy Updated');
  t.is(updated.lastName, 'Smith');
});

test('Repository.findOneAndUpdate() when not found', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const updated = await repository.findOneAndUpdate(
    { _id: new ObjectID('5acd2f7be2f6ee1560b53152') },
    { $set: { firstName: 'Some', lastName: 'User' } }
  );

  t.is(updated, null);
});

test('Repository.findOneAndUpdate() upserts when not found', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

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

test('Repository.findOneAndUpdateById() when id is a string', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const updated = await repository.findOneAndUpdateById(
    '507f1f77bcf86cd799439011',
    { $set: { firstName: 'Jordy Updated' } }
  );

  t.true(updated instanceof User);
  t.true(updated._id instanceof ObjectID);
  t.is(updated._id.toHexString(), '507f1f77bcf86cd799439011');
  t.is(updated.firstName, 'Jordy Updated');
  t.is(updated.lastName, 'Smith');
});

test('Repository.findOneAndUpdateById() when id is an ObjectID', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const updated = await repository.findOneAndUpdateById(
    new ObjectID('507f1f77bcf86cd799439011'),
    { $set: { firstName: 'Jordy Updated' } }
  );

  t.true(updated instanceof User);
  t.true(updated._id instanceof ObjectID);
  t.is(updated._id.toHexString(), '507f1f77bcf86cd799439011');
  t.is(updated.firstName, 'Jordy Updated');
  t.is(updated.lastName, 'Smith');
});

test('Repository.findOneAndUpdateById() returns null on invalid id string', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const updated = await repository.findOneAndUpdateById('invalid-object-id', {
    $set: { firstName: 'Jordy Updated' }
  });

  t.is(updated, null);
});

test('Repository.findOneAndUpdateById() returns null on invalid ObjectID', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const updated = await repository.findOneAndUpdateById(
    new ObjectID('507f1f77bcf86cd799439012'),
    { $set: { firstName: 'Jordy Updated' } }
  );

  t.is(updated, null);
});

test('Repository.findOne()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const foundUser = await repository.findOne({ firstName: 'Jordy' });

  t.true(foundUser instanceof User);
  t.true(foundUser._id instanceof ObjectID);
  t.is(foundUser._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUser.id, foundUser._id.toHexString());
  t.is(foundUser.firstName, 'Jordy');
  t.is(foundUser.lastName, 'Smith');
});

test('Repository.findOne() returns null when not found', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  t.is(await repository.findOne({ firstName: 'NotFound' }), null);
});

test('Repository.findOneById() with string', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const foundUser = await repository.findOneById('507f1f77bcf86cd799439011');

  t.true(foundUser instanceof User);
  t.true(foundUser._id instanceof ObjectID);
  t.is(foundUser._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUser.id, foundUser._id.toHexString());
  t.is(foundUser.firstName, 'Jordy');
  t.is(foundUser.lastName, 'Smith');
});

test('Repository.findOneById() with with object id', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const foundUser = await repository.findOneById(
    new ObjectID('507f1f77bcf86cd799439011')
  );

  t.true(foundUser instanceof User);
  t.true(foundUser._id instanceof ObjectID);
  t.is(foundUser._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUser.id, foundUser._id.toHexString());
  t.is(foundUser.firstName, 'Jordy');
  t.is(foundUser.lastName, 'Smith');
});

test('Repository.findOneById() returns null with invalid id', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const foundUser = await repository.findOneById('invalid-id');

  t.is(foundUser, null);
});

test('Repository.find()', async t => {
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

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
  const collection = await getCollection();

  await prepareFixtures(collection);

  const repository = new Repository(User, collection);

  const foundUsers = await repository.find({ _id: fixtures[0]._id }).toArray();

  t.is(foundUsers.length, 1);
  t.true(foundUsers[0] instanceof User);
  t.true(foundUsers[0]._id instanceof ObjectID);
  t.is(foundUsers[0]._id.toHexString(), fixtures[0]._id.toHexString());
  t.is(foundUsers[0].id, fixtures[0]._id.toHexString());
  t.is(foundUsers[0].firstName, 'Jordy');
  t.is(foundUsers[0].lastName, 'Smith');
});

test('throws error when constructed with unmapped class', async t => {
  const collection = await getCollection();

  class UnmappedUser {}

  t.throws(() => {
    // tslint:disable-next-line
    new Repository(UnmappedUser, collection);
  });
});
