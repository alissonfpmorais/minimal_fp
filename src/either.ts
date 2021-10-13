export abstract class Either<Left, Right> {
  public static left<Left, Right>(left: Left): Either<Left, Right> {
    return Left.of(left);
  }

  public static right<Left, Right>(right: Right): Either<Left, Right> {
    return Right.of(right);
  }

  abstract isLeft(): this is Left;
  abstract isRight(): this is Right;
  abstract map<NextRight>(fn: (value: Right) => NextRight): Either<Left, NextRight>;
  abstract mapLeft<NextLeft>(fn: (x: Left) => NextLeft): Either<NextLeft, Right>;
  abstract flatMap<NextRight>(fn: (x: Right) => Either<Left, NextRight>): Either<Left, NextRight>;
  abstract flatMapLeft<NextLeft>(fn: (x: Left) => Either<NextLeft, Right>): Either<NextLeft, Right>;
  abstract getLeft(): Left | never;
  abstract getRight(): Right | never;
}

class Left<Left, Right> extends Either<Left, Right> {
  private constructor(private readonly _error: Left) {
    super();
  }

  static of<Left, Right>(error: Left): Either<Left, Right> {
    return new Left(error);
  }

  isLeft(): this is Left {
    return true;
  }

  isRight(): this is Right {
    return false;
  }

  map<NextRight>(_fn: (value: Right) => NextRight): Either<Left, NextRight> {
    return this as unknown as Either<Left, NextRight>;
  }

  mapLeft<NextLeft>(fn: (error: Left) => NextLeft): Either<NextLeft, Right> {
    return new Left(fn(this.getLeft()));
  }

  flatMap<NextRight>(_fn: (value: Right) => Either<Left, NextRight>): Either<Left, NextRight> {
    return this as unknown as Either<Left, NextRight>;
  }

  flatMapLeft<NextLeft>(fn: (x: Left) => Either<NextLeft, Right>): Either<NextLeft, Right> {
    return fn(this.getLeft());
  }

  getLeft(): Left | never {
    return this._error;
  }

  getRight(): Right | never {
    throw new Error('No right value found!');
  }
}

class Right<Left, Right> extends Either<Left, Right> {
  private constructor(private readonly _data: Right) {
    super();
  }

  static of<Left, Right>(data: Right): Either<Left, Right> {
    return new Right(data);
  }

  isLeft(): this is Left {
    return false;
  }

  isRight(): this is Right {
    return true;
  }

  map<NextRight>(fn: (value: Right) => NextRight): Either<Left, NextRight> {
    return new Right(fn(this.getRight()));
  }

  mapLeft<NextLeft>(_fn: (error: Left) => NextLeft): Either<NextLeft, Right> {
    return this as unknown as Either<NextLeft, Right>;
  }

  flatMap<NextRight>(fn: (value: Right) => Either<Left, NextRight>): Either<Left, NextRight> {
    return fn(this.getRight());
  }

  flatMapLeft<NextLeft>(_fn: (x: Left) => Either<NextLeft, Right>): Either<NextLeft, Right> {
    return this as unknown as Either<NextLeft, Right>;
  }

  getLeft(): Left | never {
    throw new Error('No left value found!');
  }

  getRight(): Right | never {
    return this._data;
  }
}
