import {
  CreateEmbedType,
  defineClassMetadata,
  defineEmbeddedDocumentMetadata,
  defineEmbedManyField,
  defineEmbedOneField,
  defineField,
  DocumentMetadata,
  EmbedManyAs
} from '../metadata';

export { EmbedManyAs } from '../metadata';

export function Document<T>(opts: DocumentMetadata<T>): ClassDecorator {
  return (target: Function): void => {
    defineClassMetadata(target, opts);
  };
}

export function EmbeddedDocument(): ClassDecorator {
  return (target: Function): void => {
    defineEmbeddedDocumentMetadata(target);
  };
}

export function Field(): PropertyDecorator {
  return (target: Function, propertyKey: string): void => {
    defineField(target, propertyKey);
  };
}

export function EmbedOne<T>(type: CreateEmbedType<T>): PropertyDecorator {
  return (target: Function, propertyKey: string): void => {
    defineEmbedOneField(target, propertyKey, type);
  };
}

export function EmbedMany<T>(
  type: CreateEmbedType<T>,
  as: EmbedManyAs = EmbedManyAs.ARRAY
): PropertyDecorator {
  return (target: Function, propertyKey: string): void => {
    defineEmbedManyField(target, propertyKey, type, as);
  };
}
