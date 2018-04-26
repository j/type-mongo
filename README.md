<h1 align="center" style="border-bottom: none;">🔗 type-mongo</h1>
<h3 align="center">A <a href="https://www.typescriptlang.org/docs/handbook/decorators.html">@decorator</a> based <a href="https://www.mongodb.com/">MongoDB</a> document to ES6 class mapper.</h3>
<p align="center">
    <a href="https://travis-ci.org/j/type-mongo">
        <img alt="Travis" src="https://img.shields.io/travis/j/type-mongo/preview.svg">
    </a>
    <a href="https://codecov.io/gh/j/type-mongo/branch/preview">
        <img alt="Travis" src="https://img.shields.io/codecov/c/github/j/type-mongo/preview.svg">
    </a>
</p>

**type-mongo** makes it easy to map javascript classes to MongoDB documents and back using @decorators.

## Install

```sh
yarn add type-mongo
```

## Usage

### Quickstart

```ts
import { GraphQLServer } from 'type-mongo';
import { connect, createRepository, Document, Field } from 'type-mongo';

@Document({ collectionName: 'users' })
class User {
  @Field()
  public _id: ObjectID;

  @Field()
  public firstName: string;

  @Field()
  public lastName: string;

  get id(): string {
    return this._id.toHexString();
  }
}

// ...

await connect('mongodb://localhost', { defaultDatabase: 'my_db' });

const userRepository = createRepository(User);

// Find Users
const users = await userRepository.find().toArray(); // User[]

// Find a User
const user = await userRepository.findOne({ firstName: 'John' }); // User

// Save a user
const user = new User();
user.firstName = 'John';
user.lastName = 'Doe';

const savedUser = await userRepository.save(user); // user === savedUser

// Delete a User
await userRepository.deleteOne({ firstName: 'John' }); // bye bye John

// Delete many Users
await userRepository.deleteMany({}); // bye bye everyone

// Count Users
await userRepository.count({ firstName: 'John' });

// Find a User and update
const johnny = await userRepository.findOneAndUpdate(
    { firstName: 'John' },
    { $set: { firstName: 'Johnny' } }
);

```