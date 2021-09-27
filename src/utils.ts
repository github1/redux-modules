export type Predicate<TArg0, TArg1 = undefined> = TArg1 extends undefined
  ? (arg0: TArg0) => boolean
  : (arg0: TArg0, arg1: TArg1) => boolean;

export type Handler<T, R = void> = (o: T) => R;

export type LengthOfTuple<T extends any[]> = T extends { length: infer L }
  ? L
  : never;

type DropFirstInTuple<T extends any[]> = ((...args: T) => any) extends (
  arg: any,
  ...rest: infer U
) => any
  ? U
  : T;

export type LastInTuple<T extends any[]> = T[LengthOfTuple<
  DropFirstInTuple<T>
>];

// type ConcatX<T extends readonly (readonly any[])[]> = [
//   ...T[0],
//   ...T[1],
//   ...T[2],
//   ...T[3],
//   ...T[4],
//   ...T[5],
//   ...T[6],
//   ...T[7],
//   ...T[8],
//   ...T[9],
//   ...T[10],
//   ...T[11],
//   ...T[12],
//   ...T[13],
//   ...T[14],
//   ...T[15],
//   ...T[16],
//   ...T[17],
//   ...T[18],
//   ...T[19]
// ];

type ConcatX<T extends readonly (readonly any[])[]> = [
  ...T[0],
  ...T[1],
  ...T[2],
  ...T[3],
  ...T[4],
  ...T[5]
];

type Flatten<T extends readonly any[]> = ConcatX<
  [...{ [K in keyof T]: T[K] extends any[] ? T[K] : [T[K]] }, ...[][]]
>;

export type ToTuple<
  TString extends string,
  TDelimiter extends string = '.'
> = TString extends `${infer TStringP1}${TDelimiter}${infer TStringP2}`
  ? Flatten<[TStringP1, ToTuple<TStringP2, TDelimiter>]>
  : [TString];

type TypeOfNestedProperties<
  TValue,
  TKey = undefined,
  TKey1 = undefined,
  TKey2 = undefined,
  TKey3 = undefined,
  TKey4 = undefined
> = TKey extends undefined
  ? TValue
  : TKey extends string
  ? { [k in TKey]: TypeOfNestedProperties<TValue, TKey1, TKey2, TKey3, TKey4> }
  : TValue;

export type TypeOfNestedPropertiesFromKeys<
  TValue,
  TKeys extends string[]
> = TypeOfNestedProperties<
  TValue,
  TKeys[0],
  TKeys[1],
  TKeys[2],
  TKeys[3],
  TKeys[4]
>;

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// If T is `any` a union of both side of the condition is returned.
type UnionForAny<T> = T extends never ? 'A' : 'B';

// Returns true if type is any, or false for any other type.
export type IsStrictlyAny<T> = UnionToIntersection<UnionForAny<T>> extends never
  ? true
  : false;

export type IsAny<
  TType,
  TIsAny = TType,
  TIsNotAny = never
> = true extends IsStrictlyAny<TType> ? TIsAny : TIsNotAny;

export type NotAny<
  TType,
  TIsAny = never,
  TIsNotAny = TType
> = 'asdadsasdasdad' extends TType ? TIsAny : TIsNotAny;

export type $AND<Ta, Tb> = true extends Ta
  ? true extends Tb
    ? true
    : false
  : false;

export type $OR<Ta, Tb> = true extends Ta
  ? true
  : true extends Tb
  ? true
  : false;

export type Optional<
  T,
  K,
  KT extends keyof T = K extends keyof T ? K : never
> = [T] extends [never]
  ? {}
  : [KT] extends [never]
  ? T
  : Pick<Partial<T>, KT> & Omit<T, KT>;

export function wrapInPath(value: any, path: string[]): any {
  const p = [...path];
  const root = {};
  let wrapper = root;
  while (p.length > 0) {
    const k = p.shift();
    wrapper[k] = p.length === 0 ? value : {};
    wrapper = wrapper[k];
  }
  return root;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: any, source: any): any {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}
