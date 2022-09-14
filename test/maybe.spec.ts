/* eslint-disable @typescript-eslint/typedef */
import { Maybe } from '../src';

describe('Testing Maybe Monad', () => {
  describe('Testing Nothing', () => {
    it('Creating a Nothing item should flag as Some', () => {
      const nothing = Maybe.nothing();
      expect(nothing.isSome()).toEqual(false);
    });

    it('Creating a Nothing item should not flag as Nothing', () => {
      const nothing = Maybe.nothing();
      expect(nothing.isNothing()).toEqual(true);
    });

    it('Getting some value with default of a Nothing should show the default value', () => {
      const nothing = Maybe.nothing();
      expect(nothing.getOrDefault(10)).toEqual(10);
    });

    it('Getting some value without default of a Nothing item should raise an error', () => {
      const nothing = Maybe.nothing();
      expect(nothing.getSome).toThrow();
    });

    it('Flat mapping a Nothing item to Some item should not change the result', () => {
      const nothing = Maybe.nothing();
      const newNothing = nothing.flatMap((_value) => Maybe.some(10));
      expect(newNothing.getSome).toThrow();
    });

    it('Flat mapping a Nothing item to Nothing item should not change the result', () => {
      const nothing = Maybe.nothing();
      const newNothing = nothing.flatMap((_value) => Maybe.nothing());
      expect(newNothing.getSome).toThrow();
    });

    it('Mapping a Nothing item to some value should not change the result', () => {
      const nothing = Maybe.nothing();
      const newNothing = nothing.map((_value) => 10);
      expect(newNothing.getSome).toThrow();
    });

    it('Filtering a Nothing should always result in Nothing', () => {
      const nothing = Maybe.nothing();
      const newNothing1 = nothing.filter((_value) => false);
      const newNothing2 = nothing.filter((_value) => true);
      expect(newNothing1.isNothing()).toEqual(true);
      expect(newNothing2.isNothing()).toEqual(true);
    });

    it('Converting a Nothing to Either should result in Left', () => {
      const nothing = Maybe.nothing();
      const either = nothing.toEither(404);
      expect(either.isLeft()).toEqual(true);
      expect(either.getLeft()).toEqual(404);
    });
  });

  describe('Testing Some(x)', () => {
    it('Creating a some item should flag as some', () => {
      const some = Maybe.some('hello');
      expect(some.isSome()).toEqual(true);
    });

    it('Creating a some item should not flag as nothing', () => {
      const some = Maybe.some('hello');
      expect(some.isNothing()).toEqual(false);
    });

    it('Getting some value with default of a Some item should return the content inside', () => {
      const some = Maybe.some('hello');
      expect(some.getOrDefault('hola')).toEqual('hello');
    });

    it('Getting some value without default of a Some item should return the content', () => {
      const some = Maybe.some('hello');
      expect(some.getSome()).toEqual('hello');
    });

    it('Flat mapping a Some item to Some item should change the result', () => {
      const some = Maybe.some('hello');
      const newSome = some.flatMap((_value) => Maybe.some(10));
      expect(newSome.getSome()).toEqual(10);
    });

    it('Flat mapping a Some item to Nothing item should change to Nothing', () => {
      const some = Maybe.some('hello');
      const newSome = some.flatMap((_value) => Maybe.nothing());
      expect(newSome.getSome).toThrow();
    });

    it('Mapping a Some item to something should change the result', () => {
      const some = Maybe.some('hello');
      const newSome = some.map((_value) => 10);
      expect(newSome.getSome()).toEqual(10);
    });

    it('Filtering a Some item should result in Some if predicate results true, or Nothing on false or exception', () => {
      const some = Maybe.some('hello');

      const newSome1 = some.filter((value) => typeof value === 'string');
      const newSome2 = some.filter((value) => typeof value === 'number');
      const newSome3 = some.filter((_value) => {
        throw new Error();
      });

      expect(newSome1.isSome()).toEqual(true);
      expect(newSome2.isSome()).toEqual(false);
      expect(newSome3.isSome()).toEqual(false);
    });

    it('Converting a Some to Either should result in Right', () => {
      const some = Maybe.some('hello');
      const either = some.toEither(404);
      expect(either.isRight()).toEqual(true);
      expect(either.getRight()).toEqual('hello');
    });
  });
});
