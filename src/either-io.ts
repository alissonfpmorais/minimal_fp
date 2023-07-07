import { Either } from './either';
import { IO } from './io';

export type ErrorFn<Left> = (error: unknown) => Left;
export type FailureFn<Left> = (error: unknown) => Left | Error;

export const CRITICAL_ERROR: string = `Critical error! Does not throw an exception inside the error handler!`;

export class EitherIO<Left, Right> {
  private readonly _defaultFailureFn: FailureFn<Left>;

  constructor(private readonly _defaultErrorFn: ErrorFn<Left>, private readonly _io: IO<Either<Left | Error, Right>>) {
    this._defaultFailureFn = EitherIO._makeErrorWrapper(_defaultErrorFn);
  }

  get io(): IO<Either<Left | Error, Right>> {
    return this._io as IO<Either<Left | Error, Right>>;
  }

  private static _makeErrorWrapper<Left>(defaultErrorFn: ErrorFn<Left>): FailureFn<Left> {
    return (error: unknown): Left | Error => {
      try {
        return defaultErrorFn(error);
      } catch (error) {
        return new Error(CRITICAL_ERROR);
      }
    };
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
      IO.from(async () => {
        const defaultFailureFn: FailureFn<Left> = EitherIO._makeErrorWrapper(defaultErrorFn);

        try {
          const either: Either<Left, Right> = await fn();
          if (either instanceof Either) return either;
          return Either.left(defaultFailureFn('Not instance of Either'));
        } catch (error) {
          return Either.left(defaultFailureFn(error));
        }
      }),
    );
  }

  static from<Left, Right>(defaultErrorFn: ErrorFn<Left>, fn: () => Promise<Right> | Right): EitherIO<Left, Right> {
    return new EitherIO(
      defaultErrorFn,
      IO.from(async () => {
        const defaultFailureFn: FailureFn<Left> = EitherIO._makeErrorWrapper(defaultErrorFn);

        try {
          const value: Right = await fn();
          return Either.right(value);
        } catch (error) {
          return Either.left(defaultFailureFn(error));
        }
      }),
    );
  }

  static raise<Left, Right>(errorFn: () => Left): EitherIO<Left, Right> {
    const defaultFailureFn: FailureFn<Left> = EitherIO._makeErrorWrapper(errorFn);
    return new EitherIO(errorFn, IO.of(Either.left(defaultFailureFn(undefined))));
  }

  flatMap<NextRight>(
    fn: (value: Right, errorFn: ErrorFn<Left>) => Promise<EitherIO<Left, NextRight>> | EitherIO<Left, NextRight>,
  ): EitherIO<Left, NextRight> {
    const nextIO: IO<Either<Left | Error, NextRight>> = this._io.flatMap(
      async (either: Either<Left | Error, Right>) => {
        if (either.isLeft()) return IO.of(either) as unknown as IO<Either<Left | Error, NextRight>>;

        try {
          const eitherIO: EitherIO<Left | Error, NextRight> = await fn(either.getRight(), this._defaultErrorFn);
          return eitherIO.io;
        } catch (error) {
          return IO.of(Either.left(this._defaultFailureFn(error)));
        }
      },
    );

    return new EitherIO(this._defaultErrorFn, nextIO);
  }

  map<NextRight>(fn: (value: Right) => Promise<NextRight> | NextRight): EitherIO<Left, NextRight> {
    return this.flatMap(async (value: Right) => {
      const nextValue: NextRight = await fn(value);
      return EitherIO.of(this._defaultErrorFn, nextValue);
    });
  }

  tap(fn: (value: Right) => Promise<unknown> | unknown): EitherIO<Left, Right> {
    return this.flatMap(async (value: Right) => {
      try {
        await fn(value);
      } catch (_error) {
        // noop
      }

      return EitherIO.of(this._defaultErrorFn, value);
    });
  }

  filter(errorFn: () => Left, fn: (value: Right) => boolean | Promise<boolean>): EitherIO<Left, Right> {
    return this.flatMap(async (value: Right) => {
      try {
        const isValid: boolean = await fn(value);
        return isValid ? EitherIO.of(this._defaultErrorFn, value) : EitherIO.raise(errorFn);
      } catch (error) {
        return EitherIO.raise(errorFn);
      }
    });
  }

  zip<OtherRight, NextRight>(
    eitherIoMonad: EitherIO<Left, OtherRight>,
    fn: (value1: Right, value2: OtherRight) => Promise<NextRight> | NextRight,
  ): EitherIO<Left, NextRight> {
    return this.flatMap(async (value: Right) => {
      const either: Either<Left | Error, OtherRight> = await eitherIoMonad.safeRun();
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
    const nextIO: IO<Either<NextLeft | Error, Right>> = this._io.flatMap(async (either: Either<Left, Right>) => {
      if (either.isRight()) return IO.of(either) as unknown as IO<Either<NextLeft | Error, Right>>;

      try {
        const eitherIO: EitherIO<NextLeft, Right> = await fn(either.getLeft());
        return eitherIO.io;
      } catch (error) {
        const nextDefaultFailureFn: FailureFn<NextLeft> = EitherIO._makeErrorWrapper(nextDefaultErrorFn);
        return IO.of(Either.left(nextDefaultFailureFn(error)));
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

  catch(fn: (error: Left | Error) => Promise<Either<Left, Right>> | Either<Left, Right>): EitherIO<Left, Right> {
    const callback: () => Promise<Either<Left, Right>> = async () => {
      const either: Either<Left | Error, Right> = await this.safeRun();
      if (either.isLeft()) return fn(either.getLeft());
      return either as Either<Left, Right>;
    };

    return EitherIO.fromEither(this._defaultErrorFn, callback);
  }

  async unsafeRun(): Promise<Right> {
    const either: Either<Left | Error, Right> = await this._io.unsafeRun();
    if (either.isLeft()) throw either.getLeft();
    return either.getRight();
  }

  async safeRun(): Promise<Either<Left | Error, Right>> {
    const either: Either<Error, Either<Left | Error, Right>> = await this._io.safeRun();
    if (either.isLeft()) return either as unknown as Either<Left | Error, Right>;
    return either.getRight();
  }
}
