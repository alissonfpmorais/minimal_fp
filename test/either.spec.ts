import { Either } from '../src';

describe('Testing Either Monad', () => {
  describe('Testing Left', () => {
    const errorMessage: string = 'You shall not pass';
    let left: Either<string, number>;

    beforeAll(() => {
      left = Either.left(errorMessage);
    });

    it('Creating a left item should flag left', () => {
      expect(left.isLeft()).toEqual(true);
    });

    it('Creating a left item should not flag right', () => {
      expect(left.isRight()).toEqual(false);
    });

    it('Getting the left content of a left item should occur successfully', () => {
      expect(left.getLeft()).toEqual(errorMessage);
    });

    it('Getting the right content of a left item should raise error', () => {
      expect(left.getRight).toThrow('No right value found!');
    });

    it('Flat mapping right content of a left item should not change the content', () => {
      const nextLeft: Either<string, string> = left.flatMap((_item: number) => Either.right('success'));
      expect(nextLeft.getLeft()).toEqual(errorMessage);
      expect(nextLeft.getRight).toThrow('No right value found!');
    });

    it('Mapping right content of a left item should not change the content', () => {
      const nextLeft: Either<string, string> = left.map((_item: number) => 'success');
      expect(nextLeft.getLeft()).toEqual(errorMessage);
      expect(nextLeft.getRight).toThrow('No right value found!');
    });

    it('Flat mapping left content of a left item should change the content', () => {
      const nextErrorMessage: string = 'Another one?';
      const nextLeft: Either<string, number> = left.flatMapLeft(() => Either.left(nextErrorMessage));
      expect(nextLeft.getLeft()).toEqual(nextErrorMessage);
      expect(nextLeft.getRight).toThrow('No right value found!');
    });

    it('Mapping left content of a left item should change the content', () => {
      const nextErrorMessage: string = 'Another one?';
      const nextLeft: Either<string, number> = left.mapLeft(() => nextErrorMessage);
      expect(nextLeft.getLeft()).toEqual(nextErrorMessage);
      expect(nextLeft.getRight).toThrow('No right value found!');
    });
  });

  describe('Testing Right', () => {
    const rightValue: number = 42;
    let right: Either<string, number>;

    beforeAll(() => {
      right = Either.right(rightValue);
    });

    it('Creating a right item should not flag left', () => {
      expect(right.isLeft()).toEqual(false);
    });

    it('Creating a right item should flag right', () => {
      expect(right.isRight()).toEqual(true);
    });

    it('Getting the left content of a right item should raise error', () => {
      expect(right.getLeft).toThrow('No left value found!');
    });

    it('Getting the right content of a right item should occur successfully', () => {
      expect(right.getRight()).toEqual(rightValue);
    });

    it('Flat mapping right content of a right item should change the content', () => {
      const nextLeft: Either<string, number> = right.flatMap((item: number) => Either.right(item + 10));
      expect(nextLeft.getRight()).toEqual(52);
      expect(nextLeft.getLeft).toThrow('No left value found!');
    });

    it('Mapping right content of a right item should change the content', () => {
      const nextLeft: Either<string, number> = right.map((item: number) => item + 10);
      expect(nextLeft.getRight()).toEqual(52);
      expect(nextLeft.getLeft).toThrow('No left value found!');
    });

    it('Flat mapping left content of a right item should not change the content', () => {
      const nextErrorMessage: string = 'Another one?';
      const nextLeft: Either<string, number> = right.flatMapLeft(() => Either.left(nextErrorMessage));
      expect(nextLeft.getRight()).toEqual(rightValue);
      expect(nextLeft.getLeft).toThrow('No left value found!');
    });

    it('Mapping left content of a right item should not change the content', () => {
      const nextErrorMessage: string = 'Another one?';
      const nextLeft: Either<string, number> = right.mapLeft(() => nextErrorMessage);
      expect(nextLeft.getRight()).toEqual(rightValue);
      expect(nextLeft.getLeft).toThrow('No left value found!');
    });
  });
});
