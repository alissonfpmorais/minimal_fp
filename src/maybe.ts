import { Either } from './either';

export abstract class Maybe<SomeType> {
  public static some<Type>(some: Type): Some<Type> {
    return Some.of(some);
  }

  public static nothing(): Nothing {
    return Nothing.instanciate();
  }

  abstract isSome(): this is Some<SomeType>;
  abstract isNothing(): this is Nothing;
  abstract map<NextType>(fn: (value: SomeType) => NextType): Maybe<NextType>;
  abstract filter(fn: (SomeType) => boolean | never): Maybe<SomeType>;
  abstract flatMap<NextType>(fn: (x: SomeType) => Maybe<NextType>): Maybe<NextType>;
  abstract getSome(): SomeType | never;
  abstract getOrDefault(def: SomeType): SomeType;
  abstract toEither<Left>(leftValue: Left): Either<Left, SomeType>;
}

export class Some<Type> extends Maybe<Type> {
  private constructor(private readonly _data: Type) {
    super();
  }

  static of<Type>(data: Type): Some<Type> {
    return new Some(data);
  }

  isSome(): this is Some<Type> {
    return true;
  }

  isNothing(): this is Nothing {
    return false;
  }

  getSome(): Type {
    return this._data;
  }

  getOrDefault(_def: Type): Type {
    return this._data;
  }

  map<NextType>(fn: (value: Type) => NextType): Maybe<NextType> {
    try {
      return Some.of(fn(this.getSome()));
    } catch {
      return Nothing.instanciate();
    }
  }

  flatMap<NextType>(fn: (value: Type) => Maybe<NextType>): Maybe<NextType> {
    try {
      return fn(this.getSome());
    } catch {
      return Nothing.instanciate();
    }
  }

  filter(fn: (SomeType: Type) => boolean | never): Maybe<Type> {
    try {
      if (fn(this._data)) return this;
      else return Nothing.instanciate();
    } catch {
      return Nothing.instanciate();
    }
  }

  toEither<Left>(_leftValue: Left): Either<Left, Type> {
    return Either.right(this._data);
  }
}

export class Nothing extends Maybe<never> {
  private constructor() {
    super();
  }

  static instanciate(): Nothing {
    return new Nothing();
  }

  isSome(): this is Some<never> {
    return false;
  }

  isNothing(): this is Nothing {
    return true;
  }

  getSome(): never {
    throw new Error("Value doesn't exist!");
  }

  getOrDefault<Type>(defaultValue: Type): Type {
    return defaultValue;
  }

  map(_fn: (value: never) => unknown): Nothing {
    return this;
  }

  flatMap(_fn: (value: never) => Maybe<unknown>): Nothing {
    return this;
  }

  filter(_fn: (SomeType: never) => boolean | never): Nothing {
    return this;
  }

  toEither<Left>(leftValue: Left): Either<Left, never> {
    return Either.left(leftValue);
  }
}
