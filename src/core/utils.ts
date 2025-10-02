import { createDIToken, DIContainer, DIFactory, DIToken } from "fioc";

/**
 * Builds a function that will resolve the provided tokens in a server container.
 * The function it returns must be exported as a server action and acts as dependency
 * to serverConsumerProxies.
 *
 * @param serverContainer - The DI container that holds server-side dependencies
 * @returns A server action function that resolves tokens within the server container
 * @throws {Error} If the resolved token is not a function
 * @example
 * ```ts
 * "use server"
 * import { serverContainer } from "@/ioc/serverContainer";
 *
 * export const iocServerHandler = buildIoCServerHandler(serverContainer);
 * ```
 */
export function buildIoCServerHandler<T extends DIContainer<any>>(
  serverContainer: DIContainer<T>
) {
  return async (tokenKey: string, ...params: unknown[]) => {
    const token = createDIToken().as(tokenKey);

    const resolved = serverContainer.resolve(token) as (
      ...params: unknown[]
    ) => unknown;

    if (typeof resolved !== "function") {
      throw new Error(
        `IoCServerHandler: The provided token Symbol(${tokenKey}) does not resolve to a function.`
      );
    }
    return await resolved(...params);
  };
}

/**
 * Token used to resolve the IoC Server Action Handler in the client container.
 * This token must be registered with the server action created by buildIoCServerHandler.
 */
export const IoCServerHandlerToken = createDIToken<
  ReturnType<typeof buildIoCServerHandler>
>().as("IoCServerHandlerToken");

/**
 * Creates a DIFactory that proxies server-side controller calls.
 * The proxy maintains the same interface as the original controller but executes it on the server
 * through a server action.
 *
 * @param token - The token of the server-side controller to proxy
 * @returns A DIFactory that creates a proxy for the server-side controller
 * @throws {Error} If called directly on the server
 * @example
 * ```ts
 * const clientContainer = buildDIContainer()
 *   .register(IoCServerHandlerToken, iocServerHandler)
 *   .registerConsumer(createServerControllerProxy(UserControllerToken))
 *   .getResult();
 * ```
 */
export function createServerControllerProxy<
  T extends DIToken<Val, Key>,
  Val,
  Key extends string
>(token: T): DIFactory<Key, [ReturnType<typeof buildIoCServerHandler>]> {
  return {
    token,
    dependencies: [IoCServerHandlerToken],
    factory:
      (iocServerAction) =>
      async (...args: unknown[]) => {
        if (typeof window !== "undefined") {
          return await iocServerAction(
            Symbol.keyFor(token) ?? "UNDEFINED",
            ...args
          );
        }

        throw new Error(
          `Server controller proxy called on the server with token (${Symbol.keyFor(
            token
          )})`
        );
      },
  };
}
