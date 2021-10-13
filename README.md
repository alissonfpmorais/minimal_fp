# Minimal FP

This package aims to provide a thin layer of abstraction for some well known FP concepts:
- `Either`: used for branching logic. It can hold one of both type of information, a successful one or a failure. It's commonly used in place of throwing exceptions (since those can't be tracked by the compiler type system);
- `IO`: used to perform side-effects, like HTTP requests, database access, etc. The side effect is performed only when requested (unlike a `Promise` that is ___eager___ and runs as soon as possible).

This package also offers a syntax sugar to use both `Either` and `IO` together (here called `EitherIO`). Since IO can't keep track of type errors, `Either` and `IO` are used together so that side-effects are performed lazily, but also type errors are tracked by compiler.

## Usage

To import the you can follow one of two options:
```typescript
import { Either, IO, EitherIO } from '@alissonfpmorais/minimal_fp';

// or
const { Either, IO, EitherIO } = require('@alissonfpmorais/minimal_fp');
```

Some examples using `Either` monad:
```typescript
const eitherSuccess: Either<string, string> = Either.right<string, number>(42)
  .flatMap((value: number) => {
    if (typeof value === 'number') return Either.right(value);
    return Either.left('You shall not pass');
  })
  .map((value: number) => String(value));

const eitherFailure: Either<string, string> = Either.left('You shall not pass')
  .flatMap((value: number) => {
    if (typeof value === 'number') return Either.right(value);
    return Either.left('Another one?');
  })
  .map((value: number) => String(value));

console.log(eitherSuccess.isRight()); // true
console.log(eitherSuccess.isLeft()); // false
console.log(eitherSuccess.getRight()); // "42"
console.log(eitherSuccess.getLeft()); // throw exception Error('No left value found')

console.log(eitherFailure.isRight()); // false
console.log(eitherFailure.isLeft()); // true
console.log(eitherFailure.getRight()); // throw exception Error('No right value found')
console.log(eitherFailure.getLeft()); // 'You shall not pass'
```

Some examples of `IO`:
```typescript
class HttpClient {
  // TODO
}

const httpClient: HttpClient = new HttpClient('baseUrl');

function requestMessages(userId: string): IO<Message[]> {
  return IO.of(userId).map((value: string) => {
    return httpClient.get('/messages').appendQuery('userId', value).exec();
  });
}

function requestUserByEmail(email: string): IO<User> {
  return IO.of(email).map((value: string) => {
    return httpClient.get('/user').appendQuery('userId', value).exec();
  });
}

function requestUserMessagesByEmail(email: string): IO<Message[]> {
  return IO.of(email)
    .flatMap(requestUserByEmail)
    .flatMap((user: User) => requestMessages(user.id))
    .filter(
      () => new Error('No messages'),
      (messages: Message[]) => messages.length > 0,
    );
}

async function unsafeMain(): Promise<void> {
  const email: string = 'example@email.com'; // 2 messages
  const messages: Message[] = await requestUserMessagesByEmail(email).unsafeRun();
  console.log(messages); // ["message 1", "message 2"]

  const email2: string = 'example2@email.com'; // 0 messages
  const messages2: Message[] = await requestUserMessagesByEmail(email2).unsafeRun(); // throws exception Error: 'No messages' (use try/catch)
  console.log(messages2);
}

async function safeMain(): Promise<void> {
  const email: string = 'example@email.com'; // 2 messages
  const eMessages: Either<Error, Message[]> = await requestUserMessagesByEmail(email).safeRun();
  if (eMessages.isRight()) console.log(eMessages.getRight()); // ["message 1", "message 2"]

  const email2: string = 'example2@email.com'; // 0 messages
  const eMessages2: Either<Error, Message[]> = await requestUserMessagesByEmail(email2).safeRun();
  if (eMessages2.isLeft()) console.log(eMessages2.getLeft()); // Error: "No messages"
}
```

Some examples of `EitherIO`:
```typescript
class HttpClient {
  // TODO
}

type Message = string;

type User = { readonly id: string; readonly email: string };

type RequestMessagesErrors = 'UNKNOWN' | 'NO_MESSAGES';

type RequestUserErrors = 'UNKNOWN' | 'NO_USER';

type RequestUserMessagesErrors = RequestMessagesErrors | RequestUserErrors;

const httpClient: HttpClient = new HttpClient('baseUrl');

function requestMessages(userId: string): EitherIO<RequestMessagesErrors, Message[]> {
  return EitherIO.of(() => 'UNKNOWN' as RequestMessagesErrors, userId)
    .map((value: string) => {
      return httpClient.get('/messages').appendQuery('userId', value).exec<Message[]>();
    })
    .filter(
      () => 'NO_MESSAGES',
      (messages: Message[]) => messages.length > 0,
    );
}

function requestUserByEmail(email: string): EitherIO<RequestUserErrors, User> {
  return EitherIO.of(() => 'UNKNOWN' as RequestUserErrors, email)
    .map((value: string) => {
      return httpClient.get('/user').appendQuery('userId', value).exec<User>();
    })
    .filter(
      () => 'NO_USER',
      (user: User) => !!user,
    );
}

function requestUserMessagesByEmail(email: string): EitherIO<RequestUserMessagesErrors, ReadonlyArray<Message>> {
  return EitherIO.of(() => 'UNKNOWN' as RequestUserMessagesErrors, email)
    .flatMap(requestUserByEmail)
    .flatMap((user: User) => requestMessages(user.id));
}

async function unsafeMain(): Promise<void> {
  const email: string = 'example@email.com'; // 2 messages
  const messages: Message[] = await requestUserMessagesByEmail(email).unsafeRun();
  console.log(messages); // ["message 1", "message 2"]

  const email2: string = 'example2@email.com'; // 0 messages
  const messages2: Message[] = await requestUserMessagesByEmail(email2).unsafeRun(); // throws exception "NO_MESSAGES"
  console.log(messages2);
}

async function safeMain(): Promise<void> {
  const email: string = 'example@email.com'; // 2 messages
  const eMessages: Either<RequestUserMessagesErrors, Message[]> = await requestUserMessagesByEmail(
    email,
  ).safeRun();
  if (eMessages.isRight()) console.log(eMessages.getRight()); // ["message 1", "message 2"]

  const email2: string = 'example2@email.com'; // 0 messages
  const eMessages2: Either<RequestUserMessagesErrors, Message[]> = await requestUserMessagesByEmail(
    email2,
  ).safeRun();
  if (eMessages2.isLeft()) console.log(eMessages2.getLeft()); // "NO_MESSAGES"
}

unsafeMain();
safeMain();
```