# @fioc/next

@fioc/next is a lightweight utility library for [@fioc/core](https://www.npmjs.com/package/@fioc/core) and [@fioc/react](https://www.npmjs.com/package/@fioc/react), tailored for Next.js applications. It provides a type-safe bridge between client components and server-side dependencies, integrating seamlessly with React Server Components and Server Actions for clean architecture. For stricter type safety, see [@fioc/strict](https://www.npmjs.com/package/@fioc/strict).

## Features

- 🚀 **Next.js Integration**: Optimized for React Server Components and Server Actions
- 🔒 **Type-Safe**: Automatic type resolution with validated dependency arrays
- 🎯 **Zero Runtime Overhead**: Lightweight wrapper around Server Actions
- 🛡️ **Environment Validation**: Runtime checks for server/client usage
- 🏗️ **Clean Architecture**: Enforces separation of client and server concerns
- 🔄 **Transparent Proxies**: Server dependencies appear local to client code
- 🧪 **Testing Ready**: Easy mocking of server dependencies
- 🎮 **Next.js Focused**: Designed for Next.js apps supporting Server Actions

[Jump to Basic Usage →](#basic-usage)

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Server Container Setup](#server-container-setup)
  - [Server Handler Creation](#server-handler-creation)
  - [Client Integration](#client-integration)
- [Best Practices](#best-practices)
- [Related Packages](#related-packages)

## Installation

Install using npm, pnpm, or yarn (requires `@fioc/core`):

```bash
npm install @fioc/core @fioc/next
```

```bash
pnpm install @fioc/core @fioc/next
```

```bash
yarn add @fioc/core @fioc/next
```

## Basic Usage

### Server Container Setup

Set up a server-side dependency container using `@fioc/core` or `@fioc/strict`:

```ts
// app/server/container.ts
import { buildDIContainer } from "@fioc/core";
import {
  UserRepository,
  UserRepositoryToken,
} from "./repositories/userRepository";
import {
  CreateUserUseCase,
  CreateUserUseCaseToken,
} from "./useCases/createUser";

const serverContainer = buildDIContainer()
  .register(UserRepositoryToken, new UserRepository())
  .registerFactory({
    token: CreateUserUseCaseToken,
    dependencies: [UserRepositoryToken], // Must match factory parameters
    factory: (repo) => new CreateUserUseCase(repo),
  })
  .getResult();
```

### Server Handler Creation

Create a Server Action to handle dependency resolution:

```ts
// app/server/actions.ts
"use server";
import { buildIoCServerHandler } from "@fioc/next";
import { serverContainer } from "./container";

export const iocServerHandler = buildIoCServerHandler(serverContainer);
```

### Client Integration

Set up a client-side container for Next.js client components:

```ts
// app/client/container.ts
import { buildDIContainer, buildDIManager } from "@fioc/core";
import { IoCServerHandlerToken, createServerControllerProxy } from "@fioc/next";
import { CreateUserUseCaseToken } from "../server/useCases/createUser";
import { iocServerHandler } from "../server/actions";

const clientContainer = buildDIContainer()
  .register(IoCServerHandlerToken, iocServerHandler)
  .registerFactory(createServerControllerProxy(CreateUserUseCaseToken))
  .getResult();

export const DIManager = buildDIManager()
  .registerContainer(clientContainer, "default")
  .getResult()
  .setDefaultContainer("default");
```

Wrap your Next.js app with `@fioc/react`’s provider:

```tsx
// app/layout.tsx
import { DependenciesProvider } from "@fioc/react";
import { DIManager } from "./client/container";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <DependenciesProvider manager={DIManager}>
          {children}
        </DependenciesProvider>
      </body>
    </html>
  );
}
```

Use dependencies in client components with the `useDependencies` hook:

```tsx
// app/components/CreateUser.tsx
"use client";
import { useDependencies } from "@fioc/react";
import { CreateUserUseCaseToken } from "../server/useCases/createUser";

export function CreateUserForm() {
  const { resolve } = useDependencies();
  const createUser = resolve(CreateUserUseCaseToken);

  const handleSubmit = async (formData: FormData) => {
    try {
      await createUser({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return <form action={handleSubmit}>...</form>;
}
```

## Best Practices

- Encapsulate business logic in server-side use cases
- Use controllers for scalability with future server frameworks
- Keep server and client containers separate
- Use `@fioc/strict` for enhanced type safety in server containers

## Related Packages

- [@fioc/core](https://www.npmjs.com/package/@fioc/core): Core dependency injection library
- [@fioc/strict](https://www.npmjs.com/package/@fioc/strict): Strict type-safe dependency injection
- [@fioc/react](https://www.npmjs.com/package/@fioc/react): React integration for FIOC

[Back to Top ↑](#fiocnext)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on [GitHub](https://github.com/kolostring/fioc-server-utils).

## License

MIT License - see the [LICENSE](./LICENSE) file for details.
