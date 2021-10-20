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
    return IO.of(null).map(() => fn());
  }

  static raise<Value>(errorFn: () => Error): IO<Value> {
    return IO.from(() => {
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
    return this.flatMap(async (value: Value) => {
      return IO.of(await fn(value));
    });
  }

  tap(fn: (value: Value) => Promise<void> | void): IO<Value> {
    return this.map(async (value: Value) => {
      await fn(value);
      return value;
    });
  }

  filter(errorFn: () => Error, fn: (value: Value) => boolean): IO<Value> {
    return this.flatMap(async (value: Value) => {
      return fn(value) ? IO.of(value) : IO.raise(errorFn);
    });
  }

  zip<OtherValue, NextValue>(
    ioMonad: IO<OtherValue>,
    fn: (value1: Value, value2: OtherValue) => Promise<NextValue> | NextValue,
  ): IO<NextValue> {
    return this.map(async (value: Value) => {
      const either: Either<Error, OtherValue> = await ioMonad.safeRun();
      if (either.isLeft()) throw either.getLeft();
      return fn(value, either.getRight());
    }) as IO<NextValue>;
  }

  catch(fn: (error: Error) => Promise<Value> | Value): IO<Value> {
    return IO.from(async () => {
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
