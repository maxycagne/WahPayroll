type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const registerUnauthorizedHandler = (
  handler: UnauthorizedHandler,
): (() => void) => {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};

export const handleUnauthorized = () => {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
};
