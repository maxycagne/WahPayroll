import { useQuery } from "@tanstack/react-query";
import { fileTemplatesQueryOptions } from "./queryOptions";

export default function useTemplates(role) {
  return useQuery(fileTemplatesQueryOptions(role));
}
