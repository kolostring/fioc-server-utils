import { createDIToken, DIContainer, DIFactory, DIToken } from "fioc";

/**
 * Builds a function that will resolve the provided tokens in a server container.
 * The function it returns must be exported as a server action and acts as dependency
 * to serverConsumerProxies.
 *
 * @param serverContainer
 * @returns a function that will resolve the provided token in the server container
 * @example
 * ```ts
 * "use server"; //Don't forget to add this line
 * import { serverContainer } from "@/ioc/serverContainer"; //Import the container that must run in the server
 *
 * export const iocServerHandler = buildIOCServerHandler(serverContainer); //Export the server action
 * ```
 */
export function buildIOCServerHandler<T>(serverContainer: DIContainer<T>) {
  return async (tokenKey: string, ...params: any[]) => {
    const token = createDIToken().as(tokenKey);

    const resolved = serverContainer.resolve(token) as (
      ...params: unknown[]
    ) => unknown;

    if (typeof resolved !== "function") {
      throw new Error(
        `IOCServerHandler: The provided token Symbol(${tokenKey}) does not resolve to a function.`
      );
    }
    return await resolved(...params);
  };
}

/**
 * Token that will be used to resolve the IOC Server Action Handler in the client.
 */
export const IOCServerHandlerToken = createDIToken<
  ReturnType<typeof buildIOCServerHandler>
>().as("IOCServerHandlerToken");

/**
 * Creates a DIFactory that will allow to run the provided controller in the server.
 * When resolved in the client, returns a function with the same parameters and return type as the
 * controller, so its easy to migrate from client to server and vice versa.
 *
 * @param token The token of the controller you want to proxy
 * @returns A DIFactory that will proxy the controller in the server
 * @example
 * ```ts
 * import { buildDIContainer } from "fioc";
 * import { IOCServerHandlerToken, serverFactoryProxy } from "fioc-server-utils";
 * import { iocServerHandler } from "@/ioc/iocServerHandler"; //Import the server action for ioc server handling
 * import { ControllerCreateUserToken } from "./controllers/createUser"; //Import the controller Token(only) you want to proxy
 *
 * const clientContainer = buildDIContainer()
 *   .register(IOCServerHandlerToken, iocServerHandler) //Register the server action
 *   .registerConsumer(serverFactoryProxy(ControllerCreateUserToken)) //Register the proxy
 *   .getResult(); //Get the result of the container
 * ```
 */
export function serverFactoryProxy<
  T extends DIToken<Val, Key>,
  Val,
  Key extends string
>(token: T): DIFactory<Key, [ReturnType<typeof buildIOCServerHandler>]> {
  return {
    token,
    dependencies: [IOCServerHandlerToken],
    factory:
      (iocServerAction) =>
      async (...args) => {
        if (typeof window !== "undefined") {
          return await iocServerAction(
            Symbol.keyFor(token) ?? "UNDEFINED",
            ...args
          );
        }

        throw new Error(
          `ServerConsumerProxy called in the server with token (${Symbol.keyFor(
            token
          )})`
        );
      },
  };
}
