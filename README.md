# FIOC-SERVER-UTILS

FIOC-server-utils (Functional Inversion Of Control - server utilities) is a lightweight utility library for [FIOC](https://www.npmjs.com/package/fioc) and [FIOC React](https://www.npmjs.com/package/fioc-react) to embrace React's/NextJS' Server features. It simplifies the management of server action dependencies in your React components.

## The problem it solves

FIOC-server-utils is oriented towards React/NextJS applications that mix server and client environments and need to be decoupled.
For example, you might need to call some server controllers (as Server Actions) from a client component.

Tho, the client component doesn't actually need to know about the controllers environment (server, client, or both), therefore, if you need to isolate the component for testing purposes, you can easily mock the controller.

## Features

- **Server Actions Dependency Injection**: Define dependencies as server dependencies and resolve them in your client components.
- **Lightweight**: Only two simple functions.

## Installation

Install the library using npm, pnpm or yarn:

```bash
npm install fioc-server-utils
```

```bash
pnpm install fioc-server-utils
```

```bash
yarn add fioc-server-utils
```

### 1. Creating server dependencies container

First of all, create a server dependencies container. These dependencies will be called in the server. If you don't know the procedure of creating a DI Container, please refer to [FIOC](https://www.npmjs.com/package/fioc) documentation.

```ts
import { UserRepositoryToken } from "./repositories/userRepository";
import { HTTPUserRepository } from "./repositories/httpUserRepository";

import {
  UseCaseCreateUserFactory,
  UseCaseCreateUserToken,
} from "./useCases/createUser";

import {
  ControllerCreateUserFactory,
  ControllerCreateUserToken,
} from "./controllers/createUser";

/**
 * In this example, the creation of an user is a delicate process with some critical business
 * rules that can't be exposed to the client, therefore, it must run in the server.
 *
 *
 * The process starts when the data reaches the Controller to be validated and adapted, then
 * the Use Case is executed, which will create the user in the Repository.
 *
 * When the process finishes, the Controller responds to the client with the result.
 */

const serverContainer = buildDIContainer()
  .register(UserRepositoryToken, HTTPUserRepository)
  .registerConsumer({
    token: UseCaseCreateUserToken,
    factory: UseCaseCreateUserFactory,
    dependencies: [UserRepositoryToken],
  })
  .registerConsumer({
    token: ControllerCreateUserToken,
    factory: ControllerCreateUserFactory,
    dependencies: [UseCaseCreateUserToken],
  })
  .getResult();
```

### 2. Configuring IOC Handler

Now you need to configure a server action that will work as a Handler for all the Server Dependencies. This is done by exporting a constant with the result of the function `buildIOCServerHandler`. It requires the container created in the previous step.

```tsx
"use server"; //Don't forget to add this line
import { serverContainer } from "@/ioc/serverContainer";

export const iocServerHandler = buildIOCServerHandler(serverContainer);
```

### 3. Configure the client container

First, create the client container you will call the controllers from and register the previously defined server action with the `IOCServerHandlerToken` token.

Now you need to provide to the client container a **proxy** to the controllers of the server. These "proxies" will wrapp your controllers in a function that will call the previously configured server action with the function parameters.

The utility function `serverConsumerProxy` will create a proxy for you, just provide the token of the controller you want to proxy.

```tsx
import { buildDIContainer } from "fioc";
import { IOCServerHandlerToken, serverConsumerProxy } from "fioc-server-utils";
import { iocServerHandler } from "@/ioc/iocServerHandler";

import { ControllerCreateUserToken } from "./controllers/createUser";

const clientContainer = buildDIContainer()
  .register(IOCServerHandlerToken, iocServerHandler)
  .registerConsumer(serverConsumerProxy(ControllerCreateUserToken))
  .getResult();
```

## License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on [GitHub](https://github.com/kolostring/fioc-react).

## Acknowledgments

Special thanks to the open-source community for inspiring this project.
