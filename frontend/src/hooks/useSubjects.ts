import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicService, SubjectDTO } from "../services/academicService";

export const subjectKeys = {
  all: ["subjects"] as const,
  list: () => [...subjectKeys.all, "list"] as const,
};

export function useSubjects() {
  const query = useQuery({
    queryKey: subjectKeys.list(),
    queryFn: () => academicService.getSubjects(),
    staleTime: 10 * 60 * 1000,
    select: (data) => data?.data ?? [],
  });

  const subjectMap = useMemo(
    () => Object.fromEntries((query.data ?? []).map((subject: SubjectDTO) => [subject.id, subject])),
    [query.data],
  );

  return {
    ...query,
    subjects: query.data ?? [],
    subjectMap,
  };
}
