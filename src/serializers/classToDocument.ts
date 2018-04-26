import { FieldType, getFieldMetadata } from '../metadata/index';
import { eachInMapOrObject } from '../util/eachInMapOrObject';
import { isDocument } from '../util/isDocument';

export function classToDocument<T>(object: T): any {
  if (!isDocument(object)) {
    throw new Error(
      'Objects passed to "classToDocument" must be valid @Documents().'
    );
  }

  return process(object);
}

function process<T>(object: T): any {
  const keys = Object.keys(object);

  const doc: any = {};

  keys.forEach(key => {
    const value: any = object[key];

    if (isDocument(value)) {
      throw new Error(
        "Unable to map fields to other Documents. Use ObjectID's to reference another document."
      );
    }

    const embedFieldMeta = getFieldMetadata(object, key);

    if (embedFieldMeta) {
      switch (embedFieldMeta.type) {
        case FieldType.FIELD:
          doc[key] = value;
          break;
        case FieldType.EMBED_ONE:
          doc[key] = process(value);
          break;
        case FieldType.EMBED_ARRAY:
          if (!Array.isArray(value)) {
            throw new Error(
              `Expecting array for "${key}". Got "${typeof value}".`
            );
          }

          doc[key] = value.map(process);
          break;
        case FieldType.EMBED_MAP:
        case FieldType.EMBED_OBJECT:
          if (!(value instanceof Map) && typeof value !== 'object') {
            throw new Error(`Expecting Map or object. Got "${typeof value}".`);
          }

          doc[key] = eachInMapOrObject(value, (_: string, v: any) =>
            process(v)
          );
          break;
      }
    }
  });

  return doc;
}
