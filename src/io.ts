import { Either } from './either';

type SideEffect<Value> = () => Promise<Value>;

export class IO<Value> {
  constructor(private readonly _sideEffect: SideEffect<Value>) {}

  get sideEffect(): SideEffect<Value> {
    return this._sideEffect;
  }

  static of<Value>(value: Value): IO<Value> {
    return new IO(async () => value);
  }

  static from<Value>(fn: () => Promise<Value> | Value): IO<Value> {
    return new IO(async () => fn());
  }

  static raise<Value>(errorFn: () => Error): IO<Value> {
    return new IO(async () => {
      throw errorFn();
    });
  }

  flatMap<NextValue>(fn: (value: Value) => Promise<IO<NextValue>> | IO<NextValue>): IO<NextValue> {
    return new IO(async () => {
      const value: Value = await this._sideEffect();
      const nextValue: IO<NextValue> = await fn(value);
      return nextValue.sideEffect();
    });
  }

  map<NextValue>(fn: (value: Value) => Promise<NextValue> | NextValue): IO<NextValue> {
    return new IO(async () => {
      const value: Value = await this._sideEffect();
      return fn(value);
    });
  }

  tap(fn: (value: Value) => Promise<unknown> | unknown): IO<Value> {
    return new IO(async () => {
      const value: Value = await this._sideEffect();
      await fn(value);
      return value;
    });
  }

  filter(errorFn: () => Error, fn: (value: Value) => boolean | Promise<boolean>): IO<Value> {
    return new IO(async () => {
      const value: Value = await this._sideEffect();
      const isValid: boolean = await fn(value);
      if (!isValid) throw errorFn();
      return value;
    });
  }

  zip<OtherValue, NextValue>(
    ioMonad: IO<OtherValue>,
    fn: (value1: Value, value2: OtherValue) => Promise<NextValue> | NextValue,
  ): IO<NextValue> {
    return new IO(async () => {
      const value1: Value = await this._sideEffect();
      const value2: OtherValue = await ioMonad.unsafeRun();
      return fn(value1, value2);
    });
  }

  catch(fn: (error: Error) => Promise<Value> | Value): IO<Value> {
    return new IO(async () => {
      const either: Either<Error, Value> = await this.safeRun();
      if (either.isLeft()) return fn(either.getLeft());
      return either.getRight();
    });
  }

  async unsafeRun(): Promise<Value> {
    return this._sideEffect();
  }

  async safeRun(): Promise<Either<Error, Value>> {
    try {
      const data: Value = await this.unsafeRun();
      return Either.right(data);
    } catch (error) {
      return Either.left(error);
    }
  }
}
