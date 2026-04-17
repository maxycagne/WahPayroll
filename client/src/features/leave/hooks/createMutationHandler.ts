import {
  MutationFunction,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";

export const mutationHandler = async <T = any>(
  promise: Promise<any>,
  errorMsg?: string,
): Promise<T> => {
  try {
    const res = await promise;

    if (res && typeof res === "object" && "data" in res) {
      return res.data as T;
    }

    return res as T;
  } catch (error: unknown) {
    const err = error as any;
    const errorMessage =
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      errorMsg ??
      err?.message ??
      String(err) ??
      "Something went wrong";

    throw new Error(errorMessage);
  }
};

type ToastFn = (message: string, type?: string, duration?: number) => void;

type CreateMutationProps<TData = unknown, TVariables = void> = {
  mutationFn: MutationFunction<TData, TVariables>;
  successMsg?: string;
  invalidateKeys?: QueryKey[];
  showToast: ToastFn;
  successExtra?: () => void;
  callback?: (data: TData, variables: TVariables) => Promise<void> | void;
};

export const createMutation = <TData = unknown, TVariables = void>({
  mutationFn,
  successMsg = "Operation successful",
  showToast,
  invalidateKeys = [],
  successExtra,
  callback,
}: CreateMutationProps<TData, TVariables>) => {
  const qr = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: async (data, variables) => {
      if (callback) {
        try {
          await callback(data, variables as TVariables);
        } catch (e) {
          console.error("Callback failed:", e);
        }
      }

      await Promise.all(
        invalidateKeys.map((key) => qr.invalidateQueries({ queryKey: key })),
      );

      if (successMsg) showToast(successMsg);

      successExtra?.();
    },
    onError: (err: any) => {
      const message = err?.message || "Something went wrong";
      showToast(message, "error");
    },
  });
};
