# FIOC-SERVER-UTILS

FIOC-server-utils (Functional Inversion Of Control - Server Utilities) is a lightweight utility library for [FIOC](https://www.npmjs.com/package/fioc) and [FIOC React](https://www.npmjs.com/package/fioc-react) that seamlessly integrates with React Server Components and Server Actions. It provides a **type-safe** bridge between client components and server-side dependencies, enabling clean architecture in modern React applications.

## Features

- 🚀 **Server Action Integration**: Seamless integration with React Server Components and Actions
- 🔒 **Type-safe by Design**: Full TypeScript support with compile-time dependency validation
- 🎯 **Zero Runtime Overhead**: Minimal wrapper around Server Actions
- 🛡️ **Environment Validation**: Catches improper server/client usage at runtime
- 🏗️ **Clean Architecture**: Facilitates proper separation of client and server concerns
- 🔄 **Transparent Proxies**: Server dependencies appear as local to client code
- 🧪 **Testing Ready**: Easy mocking of server dependencies
- 🎮 **Framework Agnostic**: Works with any React-based framework supporting Server Actions

[Jump to Basic Usage →](#basic-usage)

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Server Container Setup](#server-container-setup)
  - [Server Handler Creation](#server-handler-creation)
  - [Client Integration](#client-integration)

## Installation

Install using your preferred package manager:

```bash
npm install fioc-server-utils
```

```bash
pnpm install fioc-server-utils
```

```bash
yarn add fioc-server-utils
```

## Basic Usage

### Server Container Setup

First, set up your server-side dependency container:

```ts
// app/server/container.ts
import { buildDIContainer } from "fioc";
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
    dependencies: [UserRepositoryToken],
    factory: (repo) => new CreateUserUseCase(repo),
  })
  .getResult();
```

### Server Handler Creation

Create a Server Action to handle dependency resolution:

```ts
// app/server/actions.ts
"use server";
import { buildIoCServerHandler } from "fioc-server-utils";
import { serverContainer } from "./container";

export const iocServerHandler = buildIoCServerHandler(serverContainer);
```

### Client Integration

Set up your client-side container:

```ts
// app/client/container.ts
import { buildDIContainer, buildDIManager } from "fioc";
import {
  IoCServerHandlerToken,
  createServerControllerProxy,
} from "fioc-server-utils";
import { CreateUserUseCaseToken } from "../server/useCases/createUser";
import { iocServerHandler } from "../server/actions";

const clientContainer = buildDIContainer()
  .register(IoCServerHandlerToken, iocServerHandler)
  .registerConsumer(createServerControllerProxy(CreateUserUseCaseToken))
  .getResult();

export const DIManager = buildDIManager()
  .registerContainer(clientContainer, "default")
  .getResult()
  .setDefaultContainer("default");
```

Wrap your app with FIOC-React's provider:

```tsx
// app/layout.tsx
import { DependenciesProvider } from "fioc-react";
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

Use in components with the `useDependencies` hook:

```tsx
// app/components/CreateUser.tsx
"use client";
import { useDependencies } from "fioc-react";
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
      // Handle errors
      console.error(err);
    }
  };

  return <form action={handleSubmit}>...</form>;
}
```

## Best Practices

- Keep business logic in server-side use cases
- Use controllers for better scalability if at any point you will use another server framework
- Keep server and client containers separate

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on [GitHub](https://github.com/kolostring/fioc-server-utils).

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

[Back to Top ↑](#fioc-server-utils)
