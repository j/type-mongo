import {
  Collection,
  CommonOptions,
  Cursor,
  DeleteWriteOpResultObject,
  FilterQuery,
  FindOneAndReplaceOption,
  ObjectID,
  ReplaceOneOptions
} from 'mongodb';
import {
  classToDocument,
  documentToClass,
  getDocumentMetadata,
  TypedConstructor
} from 'type-mongo-mapper';

/**
 * Wraps the MongoDB collection to implement mapping between classes and documents.
 */
export class Repository<T> {
  constructor(
    private DocumentClass: TypedConstructor<T>,
    private collection: Collection
  ) {
    if (!getDocumentMetadata(DocumentClass)) {
      throw new Error(
        `"${DocumentClass.name}" is not a valid mapped document.`
      );
    }
  }

  /**
   * Returns the raw collection instance.
   */
  public getCollection(): Collection {
    return this.collection;
  }

  /**
   * Maps the mongo document to a class.
   *
   * If `intoObject` argument is passed in, it will hydrate the document
   * into the already constructed object.
   */
  public toClass(doc: any, intoObject?: T): T {
    if (!doc) {
      return null;
    }

    return documentToClass<T>(intoObject || this.DocumentClass, doc);
  }

  /**
   * Maps the class to a plain object ready for MongoDB.
   */
  public toDocument(object: T): any {
    return classToDocument(object);
  }

  /**
   * Returns the number of documents that match the filter.
   */
  public async count(filter: Object): Promise<number> {
    return this.collection.count(filter);
  }

  /**
   * Deletes many objects that match the filter.
   */
  public async deleteMany(
    filter: FilterQuery<T>,
    options?: CommonOptions
  ): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteMany(filter, options);
  }

  /**
   * Deletes one object that match the filter.
   */
  public async deleteOne(
    filter: FilterQuery<T>,
    options?: CommonOptions
  ): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteOne(filter, options);
  }

  /**
   * Deletes one object that match the filter.
   */
  public async deleteOneById(
    id: ObjectID | string,
    options?: CommonOptions
  ): Promise<DeleteWriteOpResultObject> {
    let filter: { _id: ObjectID };

    try {
      filter = this.createFilteryId(id);
    } catch (err) {
      return null;
    }

    return this.collection.deleteOne(filter, options);
  }

  /**
   * Finds all documents that match "filter" and returns the cursor which
   * automatically maps to the class.
   */
  public find(filter?: FilterQuery<T>): Cursor<T> {
    return this.collection.find(filter).map(this.toClass.bind(this));
  }

  /**
   * Finds one document that matches the filter and automatically maps it to
   * the class.
   */
  public async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.toClass(await this.collection.findOne(filter));
  }

  /**
   * Finds a single document by id and maps to class.  The "id" can be a valid
   * ObjectID as a string or an actual ObjectID instance.
   */
  public async findOneById(id: ObjectID | string): Promise<T | null> {
    let filter: { _id: ObjectID };

    try {
      filter = this.createFilteryId(id);
    } catch (err) {
      return null;
    }

    return this.findOne(filter);
  }

  /**
   * Creates or updates the object.
   */
  public async save(
    object: T & { _id?: ObjectID },
    options?: ReplaceOneOptions
  ): Promise<T> {
    if (!object._id) {
      object._id = new ObjectID();
    }

    const { result } = await this.collection.updateOne(
      { _id: object._id },
      { $set: this.toDocument(object) },
      { ...options, upsert: true }
    );

    return result && result.ok ? object : null;
  }

  /**
   * Creates a by a given plain object.
   */
  public async create(
    plainObject: Partial<T>,
    options?: ReplaceOneOptions
  ): Promise<T> {
    return this.save(this.toClass(plainObject), options);
  }

  /**
   * Updates a document by the filter and returns it.
   */
  public async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: object,
    options?: FindOneAndReplaceOption
  ): Promise<T> {
    const { value, ok } = await this.collection.findOneAndUpdate(
      filter,
      update,
      { ...options, returnOriginal: false }
    );

    return ok && value ? this.toClass(value) : null;
  }

  /**
   * Updates a document by id and returns it.
   */
  public async findOneAndUpdateById(
    id: ObjectID | string,
    update: object,
    options?: FindOneAndReplaceOption
  ): Promise<T> {
    let filter: { _id: ObjectID };

    try {
      filter = this.createFilteryId(id);
    } catch (err) {
      return null;
    }

    return this.findOneAndUpdate(filter, update, options);
  }

  /**
   * Creates the filter for "*ById" queries.
   */
  private createFilteryId(id: ObjectID | string): { _id: ObjectID } {
    if (typeof id === 'string') {
      if (!ObjectID.isValid(id)) {
        throw new Error('Invalid ObjectID given.');
      }

      return { _id: new ObjectID(id) };
    }

    return { _id: id };
  }
}
