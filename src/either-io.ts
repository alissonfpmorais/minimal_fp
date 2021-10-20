import { Either } from './either';
import { IO } from './io';

export type ErrorFn<Left> = (error: unknown) => Left;

export class EitherIO<Left, Right> {
  constructor(private readonly _defaultErrorFn: ErrorFn<Left>, private readonly _io: IO<Either<Left, Right>>) {}

  get io(): IO<Either<Left, Right>> {
    return this._io as IO<Either<Left, Right>>;
  }

  static of<Left, Right>(defaultErrorFn: ErrorFn<Left>, value: Right): EitherIO<Left, Right> {
    return new EitherIO(defaultErrorFn, IO.of(Either.right(value)));
  }

  static fromEither<Left, Right>(
    defaultErrorFn: ErrorFn<Left>,
    fn: () => Promise<Either<Left, Right>> | Either<Left, Right>,
  ): EitherIO<Left, Right> {
    return new EitherIO(
      defaultErrorFn,
      IO.from(() => fn()),
    );
  }

  static from<Left, Right>(defaultErrorFn: ErrorFn<Left>, fn: () => Promise<Right> | Right): EitherIO<Left, Right> {
    return EitherIO.fromEither(defaultErrorFn, async () => {
      const value: Right = await fn();
      return Either.right(value);
    });
  }

  static raise<Left, Right>(errorFn: () => Left): EitherIO<Left, Right> {
    return new EitherIO(errorFn, IO.of(Either.left(errorFn())));
  }

  flatMap<NextRight>(
    fn: (value: Right, errorFn: ErrorFn<Left>) => Promise<EitherIO<Left, NextRight>> | EitherIO<Left, NextRight>,
  ): EitherIO<Left, NextRight> {
    const nextIO: IO<Either<Left, NextRight>> = this._io.flatMap(async (either: Either<Left, Right>) => {
      if (either.isLeft()) return IO.of(either) as unknown as IO<Either<Left, NextRight>>;

      try {
        const eitherIO: EitherIO<Left, NextRight> = await fn(either.getRight(), this._defaultErrorFn);
        return eitherIO.io;
      } catch (error) {
        return IO.of(Either.left(this._defaultErrorFn(error)));
      }
    });

    return new EitherIO(this._defaultErrorFn, nextIO);
  }

  map<NextRight>(fn: (value: Right) => Promise<NextRight> | NextRight): EitherIO<Left, NextRight> {
    return this.flatMap(async (value: Right) => {
      const nextValue: NextRight = await fn(value);
      return EitherIO.of(this._defaultErrorFn, nextValue);
    });
  }

  tap(fn: (value: Right) => Promise<void> | void): EitherIO<Left, Right> {
    return this.flatMap(async (value: Right) => {
      Promise.resolve()
        .then(() => fn(value))
        .finally();
      return EitherIO.of(this._defaultErrorFn, value);
    });
  }

  filter(errorFn: () => Left, fn: (value: Right) => boolean): EitherIO<Left, Right> {
    return this.flatMap(async (value: Right) => {
      return fn(value) ? EitherIO.of(this._defaultErrorFn, value) : EitherIO.raise(errorFn);
    });
  }

  zip<OtherRight, NextRight>(
    eitherIoMonad: EitherIO<Left, OtherRight>,
    fn: (value1: Right, value2: OtherRight) => Promise<NextRight> | NextRight,
  ): EitherIO<Left, NextRight> {
    return this.flatMap(async (value: Right) => {
      const either: Either<Left, OtherRight> = await eitherIoMonad.safeRun();
      if (either.isLeft())
        return EitherIO.fromEither(this._defaultErrorFn, () => either) as unknown as EitherIO<Left, NextRight>;
      const nextValue: NextRight = await fn(value, either.getRight());
      return EitherIO.of(this._defaultErrorFn, nextValue);
    });
  }

  flatMapLeft<NextLeft>(
    nextDefaultErrorFn: ErrorFn<NextLeft>,
    fn: (error: Left) => Promise<EitherIO<NextLeft, Right>> | EitherIO<NextLeft, Right>,
  ): EitherIO<NextLeft, Right> {
    const nextIO: IO<Either<NextLeft, Right>> = this._io.flatMap(async (either: Either<Left, Right>) => {
      if (either.isRight()) return IO.of(either) as unknown as IO<Either<NextLeft, Right>>;

      try {
        const eitherIO: EitherIO<NextLeft, Right> = await fn(either.getLeft());
        return eitherIO.io;
      } catch (error) {
        return IO.of(Either.left(nextDefaultErrorFn(error)));
      }
    });

    return new EitherIO(nextDefaultErrorFn, nextIO);
  }

  mapLeft<NextLeft>(
    nextDefaultErrorFn: ErrorFn<NextLeft>,
    fn: (error: Left) => Promise<NextLeft> | NextLeft,
  ): EitherIO<NextLeft, Right> {
    return this.flatMapLeft(nextDefaultErrorFn, async (error: Left) => {
      const nextError: NextLeft = await fn(error);
      return EitherIO.raise(() => nextError);
    });
  }

  catch(fn: (error: Left) => Promise<Right> | Right): EitherIO<Left, Right> {
    const callback: () => Promise<Right> = async () => {
      const either: Either<Left, Right> = await this.safeRun();
      if (either.isLeft()) return fn(either.getLeft());
      return either.getRight();
    };

    return EitherIO.from(this._defaultErrorFn, callback);
  }

  async unsafeRun(): Promise<Right> {
    const either: Either<Left, Right> = await this._io.unsafeRun();
    if (either.isLeft()) throw either.getLeft();
    return either.getRight();
  }

  async safeRun(): Promise<Either<Left, Right>> {
    const either: Either<Error, Either<Left, Right>> = await this._io.safeRun();
    if (either.isLeft()) Either.right(this._defaultErrorFn);
    return either.getRight();
  }
}
