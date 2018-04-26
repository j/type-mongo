import { hasDocumentMetadata } from '../metadata/index';

export function isDocument(value: any): boolean {
  if (typeof value === 'object' && value.constructor) {
    return hasDocumentMetadata(value.constructor);
  }

  return false;
}
