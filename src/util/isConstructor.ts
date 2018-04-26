export function isConstructor(obj: any) {
  try {
    /* tslint:disable */
    new new Proxy(obj, {
      construct() {
        return obj;
      }
    })();
    /* tslint:enable */
  } catch (err) {
    return false;
  }

  return true;
}
