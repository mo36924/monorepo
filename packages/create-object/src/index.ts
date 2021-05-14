const createObject: {
  <T>(source1: T): T;
  <T, U>(source1: T, source2: U): T & U;
  <T, U, V>(source1: T, source2: U, source3: V): T & U & V;
  <T, U, V, W>(source1: T, source2: U, source3: V, source4: W): T & U & V & W;
  (...sources: any[]): any;
} = (...sources: any[]) => Object.assign(Object.create(null), ...sources);

export default createObject;
