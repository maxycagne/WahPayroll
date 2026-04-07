import {
  MutationFunction,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const mutationHandler = async (
  promise: Promise<any>,
  errorMsg?: string,
) => {
  const res = await promise;
  if (res.status !== 200) {
    throw new Error(errorMsg);
  }
  // Will always return data, change if necessary
  return res.data;
};

type CreateMutationProps<Tdata, Tvariables> = {
  mutationFn: MutationFunction<Tdata, Tvariables>; // Tdata is return type, Tvariables is data type
  successMsg: string;
  invalidateKeys: string[];
  showToast: (message: any, type?: string, duration?: number) => void;
  successExtra?: () => void;
};

export const createMutation = <Tdata, Tvariables>({
  mutationFn,
  successMsg,
  showToast,
  invalidateKeys = [],

  successExtra,
}: CreateMutationProps<Tdata, Tvariables>) => {
  const qr = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(
        invalidateKeys.map((key, index) =>
          qr.invalidateQueries({ queryKey: [key] }),
        ),
      );
      showToast(successMsg);

      successExtra?.();
    },
    onError: (err) => {
      showToast(err.message || "Sometwhing went wrong", "error");
    },
  });
};
