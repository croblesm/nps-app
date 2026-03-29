"use client";

import { useParams, usePathname } from "next/navigation";
import { AssistantContextProvider, useAssistantContext } from "@/lib/assistant-context";
import { AssistantPanel } from "@/components/ui/AssistantPanel";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  const pathname = usePathname();
  const currentPage = pathname.split("/").pop();

  return (
    <AssistantContextProvider>
      <ProjectLayoutInner projectId={projectId} currentPage={currentPage}>
        {children}
      </ProjectLayoutInner>
    </AssistantContextProvider>
  );
}

function ProjectLayoutInner({
  projectId,
  currentPage,
  children,
}: {
  projectId: string;
  currentPage: string | undefined;
  children: React.ReactNode;
}) {
  const { pageContext } = useAssistantContext();

  return (
    <>
      {children}
      <AssistantPanel
        projectId={projectId}
        page={currentPage || "dashboard"}
        pageContext={pageContext}
      />
    </>
  );
}
