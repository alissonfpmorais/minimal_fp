import { Either } from './either';

export type Resolver = (value: unknown) => unknown;

export type Computation = (resolver: Resolver) => unknown;

export class IO<Value> {
  constructor(private readonly _computation: Computation) {}

  static of<Value>(value: Value): IO<Value> {
    return new IO((resolver: Resolver) => resolver(value));
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
    const computation: Computation = this._computation;
    return new IO((resolver: Resolver) => {
      return computation(async (value: Value) => {
        return await (
          await fn(value)
        )._computation(async (nextValue: NextValue) => {
          return await resolver(nextValue);
        });
      });
    });
  }

  map<NextValue>(fn: (value: Value) => Promise<NextValue> | NextValue): IO<NextValue> {
    return this.flatMap(async (value: Value) => {
      return IO.of(await fn(value));
    });
  }

  tap(fn: (value: Value) => Promise<void>): IO<Value> {
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
      const either: Either<Error, OtherValue> = await ioMonad.run();
      if (either.isLeft()) throw either.getLeft();
      return fn(value, either.getRight());
    }) as IO<NextValue>;
  }

  catch(fn: (error: Error) => Promise<Value> | Value): IO<Value> {
    return IO.from(async () => {
      const either: Either<Error, Value> = await this.run();
      if (either.isLeft()) return await fn(either.getLeft());
      return either.getRight();
    });
  }

  async unsafeRun(): Promise<Value> {
    return (await this._computation((value: unknown) => value)) as Value;
  }

  async run(): Promise<Either<Error, Value>> {
    try {
      const data: Value = await this.unsafeRun();
      return Either.right(data);
    } catch (error) {
      return Either.left(error);
    }
  }
}