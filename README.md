<h1 align="center" style="border-bottom: none;">💰 type-mongo</h1>
<h3 align="center">A <a href="https://www.mongodb.com/">MongoDB</a> repository with ES6 class mapping</h3>
<p align="center">
    <a href="https://travis-ci.org/j/type-mongo">
        <img alt="Travis" src="https://img.shields.io/travis/j/type-mongo/preview.svg">
    </a>
    <a href="https://codecov.io/gh/j/type-mongo/branch/preview">
        <img alt="Travis" src="https://img.shields.io/codecov/c/github/j/type-mongo/preview.svg">
    </a>
</p>

**type-mongo** uses <a href="https://github.com/j/type-mongo-mapper">**type-mongo-mapper**</a> under the hood and gives a repository layer for fetching and putting data
to/from MongoDB.  This library aims to be as simple and bare-bones as possible.  If you look at the Repository class,
you'll see that it uses the MongoDB driver as raw as possible.  It does not do any change-set/dirty checking.  It simply
provies a small wrapper above the collection class to provide class/document mapping.

## Install

```sh
yarn add type-mongo type-mongo-mapper
```

## Usage

### Quickstart

```ts
import { Repository, Document, Field } from 'type-mongo';

@Document()
class User {
  @Field()
  public _id: ObjectID;

  @Field()
  public firstName: string;

  @Field()
  public lastName: string;
  
  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  get id(): string {
    return this._id.toHexString();
  }
}

const repository = new Repository(User, db.collection('users'));

// find all users
const users: User[] = await repository.find({ /* filter */ });

// find a user
const user: User = await repository.findOne({ /* filter */ });

// find a user by id
const user: User = await repository.findOneById('...');

// create a user using save()
const user = new User('John', 'Doe');
await repository.save(user);

// update user after finding them
const user: User = await repository.findOne({ firstName: 'John' });
user.firstName = 'Johnny';
await repository.save(user);

// create a user (saves to database as well)
const user: User = await repository.create({ firstName: 'John', lastName: 'Doe' });

```