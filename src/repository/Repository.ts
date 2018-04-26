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
import { ClientManager } from '../ClientManager';
import { TypedConstructor } from '../common/TypedConstructor';
import {
  assertValidClassMetadata,
  DocumentMetadata,
  getDocumentMetadata
} from '../metadata';
import { classToDocument } from '../serializers/classToDocument';
import { documentToClass } from '../serializers/documentToClass';

export class Repository<T> {
  private meta: DocumentMetadata<T>;
  private collection: Collection;

  constructor(
    private DocumentClass: TypedConstructor<T>,
    clientManager: ClientManager
  ) {
    assertValidClassMetadata(DocumentClass);

    this.meta = getDocumentMetadata(DocumentClass);

    this.collection = clientManager.getCollection(this.meta.collectionName, {
      clientName: this.meta.clientName,
      databaseName: this.meta.databaseName
    });
  }

  public getCollection(): Collection {
    return this.collection;
  }

  public toClass(doc: any, intoObject?: T): T {
    if (!doc) {
      return null;
    }

    return documentToClass<T>(intoObject || this.DocumentClass, doc);
  }

  public toDocument(object: T): any {
    return classToDocument(object);
  }

  public async count(query: Object): Promise<number> {
    return this.collection.count(query);
  }

  public async deleteMany(
    filter: FilterQuery<any>,
    options?: CommonOptions
  ): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteMany(filter, options);
  }

  public async deleteOne(
    filter: FilterQuery<any>,
    options?: CommonOptions
  ): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteOne(filter, options);
  }

  public find(filter?: { [key: string]: any }): Cursor<T> {
    return this.collection.find(filter).map(this.toClass.bind(this));
  }

  public async findOne(filter: FilterQuery<any>): Promise<T | null> {
    return this.toClass(await this.collection.findOne(filter));
  }

  public async save(
    object: T & { _id: ObjectID },
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

  public async findOneAndUpdate(
    filter: FilterQuery<any>,
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
}
