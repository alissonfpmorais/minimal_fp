import { Either, EitherIO, ErrorFn } from '../src';

describe('Testing EitherIO Monad', () => {
  const rightValue: number = 42;
  const errorMessage: string = 'You shall not pass';
  let eitherIO: EitherIO<string, number>;
  let eitherFailIO: EitherIO<string, number>;

  beforeAll(() => {
    eitherIO = EitherIO.of(() => errorMessage, rightValue);
    eitherFailIO = EitherIO.raise(() => errorMessage);
  });

  it('Creating a successful EitherIO, should keep value when unsafeRun', async () => {
    const value: number = await eitherIO.unsafeRun();
    expect(value).toEqual(rightValue);
  });

  it('Creating successful EitherIO from Promise should keep value when unsafeRun', async () => {
    const anotherIO: EitherIO<string, number> = EitherIO.from(
      () => errorMessage,
      async () => rightValue,
    );
    await expect(anotherIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Creating EitherIO from right Either should show value when unsafeRun', async () => {
    const either: Either<string, number> = Either.right(42);
    const eitherIO: EitherIO<string, number> = EitherIO.fromEither(
      () => errorMessage,
      () => either,
    );
    await expect(eitherIO.unsafeRun()).resolves.toEqual(42);
  });

  it('Creating EitherIO from left Either should show error when unsafeRun', async () => {
    const either: Either<string, number> = Either.left(errorMessage);
    const eitherIO: EitherIO<string, number> = EitherIO.fromEither(
      () => 'Another one?',
      () => either,
    );
    await expect(eitherIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Creating a failure EitherIO should raise error when unsafeRun', async () => {
    await expect(eitherFailIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Flat mapping a successful EitherIO should change the content', async () => {
    const nextIO: EitherIO<string, string> = eitherIO.flatMap((value: number, errorFn: ErrorFn<string>) =>
      EitherIO.of(errorFn, String(value)),
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(String(rightValue));
  });

  it('Flat mapping a failed EitherIO and unsafe running it should raise error', async () => {
    const nextIO: EitherIO<string, string> = eitherFailIO.flatMap((value: number, errorFn: ErrorFn<string>) =>
      EitherIO.of(errorFn, String(value)),
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Mapping a successful EitherIO should change the content', async () => {
    const nextIO: EitherIO<string, string> = eitherIO.map((value: number) => String(value));
    await expect(nextIO.unsafeRun()).resolves.toEqual(String(rightValue));
  });

  it('Mapping a failed EitherIO and unsafe running it should raise error', async () => {
    const nextIO: EitherIO<string, string> = eitherFailIO.map((value: number) => String(value));
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Tapping a successful EitherIO should not change the content', async () => {
    const fn: (value: number) => Promise<number> = async (value: number) => value;
    const tapFn: (value: number) => Promise<void> = fn as unknown as (value: number) => Promise<void>;
    const value: number = await eitherIO.tap(tapFn).unsafeRun();
    expect(value).toEqual(rightValue);
  });

  it('Tapping a failed EitherIO and unsafe runnning it should raise error', async () => {
    const fn: (value: number) => Promise<number> = async (value: number) => value;
    const tapFn: (value: number) => Promise<void> = fn as unknown as (value: number) => Promise<void>;
    const nextIO: EitherIO<string, number> = eitherFailIO.tap(tapFn);
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it("Filtering a successful EitherIO with valid condition should keep IO's value", async () => {
    const nextIO: EitherIO<string, number> = eitherIO.filter(
      () => 'Another one?',
      (value: number) => value === rightValue,
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Filtering a successful EitherIO with invalid condition should raise error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: EitherIO<string, number> = eitherIO.filter(
      () => nextErrorMessage,
      (value: number) => value !== rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(nextErrorMessage);
  });

  it('Filtering a failed EitherIO with valid condition should raise previous error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: EitherIO<string, number> = eitherFailIO.filter(
      () => nextErrorMessage,
      (value: number) => value === rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Filtering a failed EitherIO with invalid condition should raise previous error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: EitherIO<string, number> = eitherFailIO.filter(
      () => nextErrorMessage,
      (value: number) => value !== rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Zipping a successful EitherIO with another successful IO should merge values', async () => {
    const anotherIO: EitherIO<string, number> = EitherIO.of(() => errorMessage, 10);
    const nextIO: EitherIO<string, number> = eitherIO.zip(
      anotherIO,
      (value1: number, value2: number) => value1 + value2,
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(52);
  });

  it('Zipping a successful EitherIO with a failed IO should raise error', async () => {
    const nextIO: EitherIO<string, number> = eitherIO.zip(
      eitherFailIO,
      (value1: number, value2: number) => value1 + value2,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Zipping a failed EitherIO with a successful IO should raise error', async () => {
    const nextIO: EitherIO<string, number> = eitherFailIO.zip(
      eitherIO,
      (value1: number, value2: number) => value1 + value2,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
  });

  it('Zipping a failed EitherIO with a another failed IO should raise first IO error', async () => {
    const anotherErrorMessage: string = 'Another one?';
    const anotherIO: EitherIO<string, number> = EitherIO.raise(() => anotherErrorMessage);
    const nextIO: EitherIO<string, number> = eitherFailIO.zip(
      anotherIO,
      (value1: number, value2: number) => value1 + value2,
    );
    const nextIO2: EitherIO<string, number> = anotherIO.zip(
      eitherFailIO,
      (value1: number, value2: number) => value1 + value2,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(errorMessage);
    await expect(nextIO2.unsafeRun()).rejects.toEqual(anotherErrorMessage);
  });

  it('Flat left mapping a successful EitherIO should not change the content', async () => {
    const nextIO: EitherIO<boolean, number> = eitherIO.flatMapLeft(
      () => false,
      () => EitherIO.raise(() => true),
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Flat left mapping a failed EitherIO should change left content', async () => {
    const nextIO: EitherIO<boolean, number> = eitherFailIO.flatMapLeft(
      () => false,
      () => EitherIO.raise(() => true),
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(true);
  });

  it('Left mapping a successful EitherIO should not change the content', async () => {
    const nextIO: EitherIO<boolean, number> = eitherIO.mapLeft(
      () => false,
      () => true,
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Left mapping a failed EitherIO should change left content', async () => {
    const nextIO: EitherIO<boolean, number> = eitherFailIO.mapLeft(
      () => false,
      () => true,
    );
    await expect(nextIO.unsafeRun()).rejects.toEqual(true);
  });

  it("Catch a successful EitherIO should keep EitherIO's value", async () => {
    const value: number = await eitherIO.catch(() => 52).unsafeRun();
    expect(value).toEqual(rightValue);
  });

  it('Catch a failed EitherIO should map left content to new value', async () => {
    const value: number = await eitherFailIO.catch(() => 52).unsafeRun();
    expect(value).toEqual(52);
  });

  it('Safe run successful EitherIO should return Either Right', async () => {
    const either: Either<string, number> = await eitherIO.safeRun();
    expect(either.getRight()).toEqual(rightValue);
    expect(either.getLeft).toThrow('No left value found');
  });

  it('Safe run failed IO should return Either Right', async () => {
    const either: Either<string, number> = await eitherFailIO.safeRun();
    expect(either.getRight).toThrow('No right value found');
    expect(either.getLeft()).toEqual(errorMessage);
  });

  it('Check if EitherIO operators run properly', async () => {
    let message: string = '';
    const result: Either<string, number> = await eitherIO
      .flatMap((value: number, errorFn: ErrorFn<string>) => {
        message = message + 'p';
        return EitherIO.of(errorFn, value / 2);
      })
      .flatMap((value: number) => {
        message = message + 'r';
        return EitherIO.raise(() => value.toString());
      })
      .map((value: number) => {
        message = message + '0';
        return value / 2;
      })
      .catch(() => {
        message = message + 'e';
        return 42;
      })
      .map((value: number) => {
        message = message + 'c';
        return value / 2;
      })
      .tap(() => {
        message = message + 'i';
      })
      .filter(
        () => 'error',
        (value: number) => {
          message = message + 'o';
          return value < 0;
        },
      )
      .map((value: number) => {
        message = message + '1';
        return value * 2;
      })
      .flatMap((value: number, errorFn: ErrorFn<string>) => {
        message = message + '2';
        return EitherIO.of(errorFn, value / 2);
      })
      .catch(() => {
        message = message + 'u';
        return 42;
      })
      .zip(eitherIO, (value1: number, value2: number) => {
        message = message + 's';
        return value1 / 2 + value2 / 2;
      })
      .safeRun();

    expect(result.getRight()).toEqual(42);
    expect(message).toEqual('precious');
  });
});
