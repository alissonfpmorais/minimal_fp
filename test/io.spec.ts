import { Either, IO } from '../src';

describe('Testing IO Monad', () => {
  const rightValue: number = 42;
  const errorMessage: string = 'You shall not pass';
  let io: IO<number>;
  let failIO: IO<number>;

  beforeAll(() => {
    io = IO.of(rightValue);
    failIO = IO.raise(() => new Error(errorMessage));
  });

  it('Creating a successful IO should keep value when unsafeRun', async () => {
    await expect(io.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Creating successful IO from Promise should keep value when unsafeRun', async () => {
    const anotherIO: IO<number> = IO.from(async () => rightValue);
    await expect(anotherIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Creating a failure IO should raise error when unsafeRun', async () => {
    await expect(failIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Flat mapping a successful IO should change the content', async () => {
    const nextIO: IO<string> = io.flatMap((value: number) => IO.of(String(value)));
    await expect(nextIO.unsafeRun()).resolves.toEqual(String(rightValue));
  });

  it('Flat mapping a failed IO and unsafe running it should raise error', async () => {
    const nextIO: IO<string> = failIO.flatMap((value: number) => IO.of(String(value)));
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Mapping a successful IO should change the content', async () => {
    const nextIO: IO<string> = io.map((value: number) => String(value));
    await expect(nextIO.unsafeRun()).resolves.toEqual(String(rightValue));
  });

  it('Mapping a failed IO and unsafe running it should raise error', async () => {
    const nextIO: IO<string> = failIO.map((value: number) => String(value));
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Tapping a successful IO should not change the content', async () => {
    const value: number = await io.tap((value: number) => value).unsafeRun();
    expect(value).toEqual(rightValue);
  });

  it('Tapping a failed IO and unsafe runnning it should raise error', async () => {
    const nextIO: IO<number> = failIO.tap((value: number) => value);
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it("Filtering a successful IO with valid condition should keep IO's value", async () => {
    const nextIO: IO<number> = io.filter(
      () => new Error('Another one?'),
      (value: number) => value === rightValue,
    );
    await expect(nextIO.unsafeRun()).resolves.toEqual(rightValue);
  });

  it('Filtering a successful IO with invalid condition should raise error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: IO<number> = io.filter(
      () => new Error(nextErrorMessage),
      (value: number) => value !== rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toThrow(nextErrorMessage);
  });

  it('Filtering a failed IO with valid condition should raise previous error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: IO<number> = failIO.filter(
      () => new Error(nextErrorMessage),
      (value: number) => value === rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Filtering a failed IO with invalid condition should raise previous error', async () => {
    const nextErrorMessage: string = 'Another one?';
    const nextIO: IO<number> = failIO.filter(
      () => new Error(nextErrorMessage),
      (value: number) => value !== rightValue,
    );
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Zipping a successful IO with another successful IO should merge values', async () => {
    const anotherIO: IO<number> = IO.of(10);
    const nextIO: IO<number> = io.zip(anotherIO, (value1: number, value2: number) => value1 + value2);
    await expect(nextIO.unsafeRun()).resolves.toEqual(52);
  });

  it('Zipping a successful IO with a failed IO should raise error', async () => {
    const nextIO: IO<number> = io.zip(failIO, (value1: number, value2: number) => value1 + value2);
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Zipping a failed IO with a successful IO should raise error', async () => {
    const nextIO: IO<number> = failIO.zip(io, (value1: number, value2: number) => value1 + value2);
    await expect(nextIO.unsafeRun()).rejects.toThrow(errorMessage);
  });

  it('Zipping a failed IO with a another failed IO should raise first IO error', async () => {
    const anotherErrorMessage: string = 'Another one?';
    const anotherIO: IO<number> = IO.raise(() => new Error(anotherErrorMessage));
    const nextIO: IO<number> = failIO.zip(anotherIO, (value1: number, value2: number) => value1 + value2);
    const nextIO2: IO<number> = anotherIO.zip(failIO, (value1: number, value2: number) => value1 + value2);
    await expect(() => nextIO.unsafeRun()).rejects.toThrow(errorMessage);
    await expect(() => nextIO2.unsafeRun()).rejects.toThrow(anotherErrorMessage);
  });

  it("Catch a successful IO should keep IO's value", async () => {
    const value: number = await io.catch(() => 52).unsafeRun();
    expect(value).toEqual(rightValue);
  });

  it('Catch a failed IO should map Error to new value', async () => {
    const value: number = await failIO.catch(() => 52).unsafeRun();
    expect(value).toEqual(52);
  });

  it('Safe run successful IO should return Either Right', async () => {
    const either: Either<Error, number> = await io.safeRun();
    expect(either.getRight()).toEqual(rightValue);
    expect(either.getLeft).toThrow('No left value found');
  });

  it('Safe run failed IO should return Either Right', async () => {
    const either: Either<Error, number> = await failIO.safeRun();
    expect(either.getRight).toThrow('No right value found');
    expect(either.getLeft()).toEqual(new Error(errorMessage));
  });

  it('Check if IO operators run properly', async () => {
    let message: string = '';
    const result: Either<Error, number> = await io
      .flatMap((value: number) => {
        message = message + 'p';
        return IO.of(value / 2);
      })
      .flatMap((value: number) => {
        message = message + 'r';
        throw new Error(value.toString());
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
        () => new Error('error'),
        (value: number) => {
          message = message + 'o';
          return value < 0;
        },
      )
      .map((value: number) => {
        message = message + '1';
        return value * 2;
      })
      .flatMap((value: number) => {
        message = message + '2';
        return IO.of(value / 2);
      })
      .catch(() => {
        message = message + 'u';
        return 42;
      })
      .filter(
        () => new Error('error'),
        async (value: number) => {
          message = message + 's';
          return value > 0;
        },
      )
      .zip(io, (value1: number, value2: number) => {
        message = message + '!';
        return value1 / 2 + value2 / 2;
      })
      .safeRun();

    expect(result.getRight()).toEqual(42);
    expect(message).toEqual('precious!');
  });
});
