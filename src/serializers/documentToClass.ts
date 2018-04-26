import {
  FieldType,
  getFieldMetadata,
  hasDocumentMetadata
} from '../metadata/index';
import { eachInMapOrObject } from '../util/eachInMapOrObject';
import { isConstructor } from '../util/isConstructor';

export function documentToClass<T>(
  objOrCtor: T | { new (...args): T },
  doc: any
): T {
  let object: T = objOrCtor as T;
  const isCtor = isConstructor(objOrCtor);

  if (isCtor) {
    object = new (objOrCtor as { new (...args): T })();
  }

  if (!hasDocumentMetadata(object.constructor)) {
    throw new Error(
      'Unable to map mongo document to object without @Document() decorator.'
    );
  }

  return process(object, doc);
}

function process<T>(object: T, doc: any): T {
  const keys = Object.keys(doc);

  keys.forEach(key => {
    const value: any = doc[key];

    const embedFieldMeta = getFieldMetadata(object, key);

    if (embedFieldMeta) {
      switch (embedFieldMeta.type) {
        case FieldType.FIELD:
          object[key] = value;
          break;
        case FieldType.EMBED_ONE:
          object[key] = process(embedFieldMeta.createEmbedType(value), value);
          break;
        case FieldType.EMBED_ARRAY:
          object[key] = value.map(item =>
            process(embedFieldMeta.createEmbedType(item), item)
          );
          break;
        case FieldType.EMBED_OBJECT:
          object[key] = eachInMapOrObject(value, (_: string, item: any): any =>
            process(embedFieldMeta.createEmbedType(item), item)
          );
          break;
        case FieldType.EMBED_MAP:
          const map = new Map<any, any>();

          eachInMapOrObject(value, (k: string, item: any): any => {
            map.set(k, process(embedFieldMeta.createEmbedType(item), item));
          });

          object[key] = map;
          break;
      }
    }
  });

  return object;
}
