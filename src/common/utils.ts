import { createDIToken, DIConsumer, DIContainer, DIToken } from "fioc";

/**
 * Builds a function that will resolve the provided tokens in a server container.
 * The function it returns must be exported as a server action and acts as dependency
 * to serverConsumerProxies.
 *
 * @param serverContainer
 * @returns a function that will resolve the provided token in the server container
 */
export function buildIOCServerHandler(serverContainer: DIContainer) {
  return async (tokenKey: string, ...params: any[]) => {
    const token = createDIToken(tokenKey);

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
>("IOCServerHandlerToken");

/**
 * Creates a DIConsumer that will proxy the provided token in the server.
 *
 * @param token The token of the controller you want to proxy
 * @returns A DIConsumer that will proxy the controller in the server
 */
export function serverConsumerProxy<T extends DIToken<any>>(
  token: T
): DIConsumer<
  [typeof IOCServerHandlerToken],
  (args: unknown[]) => Promise<any>
> {
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
