import 'reflect-metadata';
import { TypedConstructor } from '../common/TypedConstructor';
import { isConstructor } from '../util/isConstructor';

const MODEL_METADATA_KEY = Symbol('MODEL_METADATA_KEY');
const EMBEDDED_DOCUMENT_METADATA_KEY = Symbol('EMBEDDED_DOCUMENT_METADATA_KEY');
const FIELD_METADATA_KEY = Symbol('FIELD_METADATA_KEY');

export type ToDocument<T> = (documentInstance: T) => object;
export type ToModel<T> = (doc: object) => T;
export type CreateEmbedType<T> = (doc: any) => TypedConstructor<T> | Function;

export interface DocumentMetadata<T> {
  clientName?: string;
  collectionName: string;
  databaseName?: string;
  toDocument?: ToDocument<T>;
  toModel?: ToModel<T>;
}

export interface EmbeddedDocumentMetadata<T> {
  type?: () => any;
  toDocument?: ToDocument<T>;
  toModel?: ToModel<T>;
}

export enum FieldType {
  FIELD,
  EMBED_ONE,
  EMBED_ARRAY,
  EMBED_MAP,
  EMBED_OBJECT
}

export enum EmbedManyAs {
  MAP = 'map',
  ARRAY = 'array',
  OBJECT = 'object'
}

export interface Field<T> {
  propertyKey: string;
  type: FieldType;
  createEmbedType?: (doc: any) => T;
}

export function defineClassMetadata<T>(
  DocumentClass: TypedConstructor<T> | Function,
  opts: DocumentMetadata<T>
): void {
  const meta = getOrCreateClassMetadata(DocumentClass);

  meta.clientName = opts.clientName;
  meta.collectionName = opts.collectionName;
  meta.databaseName = opts.databaseName;
}

export function defineEmbeddedDocumentMetadata<T>(
  EmbeddedDocumentClass: TypedConstructor<T> | Function
): void {
  getOrCreateEmbeddedDocumentMetadata(EmbeddedDocumentClass);
}

export function hasDocumentMetadata<T>(
  DocumentClass: TypedConstructor<T> | Function
): boolean {
  return !!Reflect.getOwnMetadata(MODEL_METADATA_KEY, DocumentClass);
}

export function getDocumentMetadata<T>(
  DocumentClass: TypedConstructor<T> | Function
): DocumentMetadata<T> {
  const meta = Reflect.getOwnMetadata(MODEL_METADATA_KEY, DocumentClass);

  if (!meta) {
    throw new Error(
      `Document metadata does not exist for class "${DocumentClass.name}".`
    );
  }

  return meta;
}

function getOrCreateClassMetadata<T>(
  DocumentClass: TypedConstructor<T> | Function
): DocumentMetadata<T> {
  let meta = Reflect.getOwnMetadata(MODEL_METADATA_KEY, DocumentClass);

  if (!meta) {
    meta = {};

    Reflect.defineMetadata(MODEL_METADATA_KEY, meta, DocumentClass);
  }

  return meta;
}

export function hasEmbeddedDocumentMetadata<T>(
  EmbeddedDocumentClass: TypedConstructor<T> | Function
): boolean {
  return !!Reflect.getOwnMetadata(
    EMBEDDED_DOCUMENT_METADATA_KEY,
    EmbeddedDocumentClass
  );
}

function getOrCreateEmbeddedDocumentMetadata<T>(
  EmbeddedDocumentClass: TypedConstructor<T> | Function
): EmbeddedDocumentMetadata<T> {
  let meta = Reflect.getOwnMetadata(
    EMBEDDED_DOCUMENT_METADATA_KEY,
    EmbeddedDocumentClass
  );

  if (!meta) {
    meta = {};

    Reflect.defineMetadata(
      EMBEDDED_DOCUMENT_METADATA_KEY,
      meta,
      EmbeddedDocumentClass
    );
  }

  return meta;
}

export function defineField<T>(target: any, propertyKey: string): void {
  const meta: Field<T> = {
    type: FieldType.FIELD,
    propertyKey
  };

  Reflect.defineMetadata(FIELD_METADATA_KEY, meta, target, propertyKey);
}

export function defineEmbedOneField<T>(
  target: any,
  propertyKey: string,
  createEmbedType: CreateEmbedType<T>
): void {
  defineEmbedField(target, propertyKey, createEmbedType, FieldType.EMBED_ONE);
}

export function defineEmbedManyField<T>(
  target: any,
  propertyKey: string,
  createEmbedType: CreateEmbedType<T>,
  as: EmbedManyAs = EmbedManyAs.ARRAY
): void {
  let fieldType: FieldType;

  switch (as) {
    case EmbedManyAs.MAP:
      fieldType = FieldType.EMBED_MAP;
      break;
    case EmbedManyAs.OBJECT:
      fieldType = FieldType.EMBED_OBJECT;
      break;
    case EmbedManyAs.ARRAY:
      fieldType = FieldType.EMBED_ARRAY;
      break;
    default:
      throw new Error(`Invalid embed as type. "${as}" given.`);
  }

  defineEmbedField(target, propertyKey, createEmbedType, fieldType);
}

function defineEmbedField<T>(
  target: any,
  propertyKey: string,
  createEmbedType: CreateEmbedType<T>,
  type: FieldType
): void {
  const meta: Field<T> = {
    type,
    propertyKey,
    createEmbedType: (doc: any): T => {
      let ClassCtor = createEmbedType(doc);
      let instance: any;

      if (!isConstructor(ClassCtor)) {
        ClassCtor = ClassCtor.constructor;
        instance = ClassCtor;
      }

      if (!hasEmbeddedDocumentMetadata(ClassCtor)) {
        throw new Error(
          `Class "${ClassCtor.name}" is not a mapped @EmbeddedDocument().`
        );
      }

      if (!instance) {
        instance = new (ClassCtor as TypedConstructor<T>)();
      }

      return instance as T;
    }
  };

  Reflect.defineMetadata(FIELD_METADATA_KEY, meta, target, propertyKey);
}

export function getFieldMetadata<T>(
  target: any,
  propertyKey: string
): Field<T> {
  return Reflect.getMetadata(FIELD_METADATA_KEY, target, propertyKey);
}

export function assertValidClassMetadata<T>(
  DocumentClass: TypedConstructor<T>
): void {
  const meta = getDocumentMetadata(DocumentClass);

  if (!meta.collectionName) {
    throw new Error(
      `Document missing "collectionName" for class "${DocumentClass.name}".`
    );
  }
}
