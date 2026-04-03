import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { GitHubClient } from "./github-client";

export default async function GitHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const db = await getDb();

  // Fetch GitHub config
  const { GitHubConfig } = await import("@/lib/db/entities/GitHubConfig");
  const configEntity = await db.getRepository(GitHubConfig).findOneBy({ projectId: id });
  const initialConfig = configEntity
    ? {
        id: configEntity.id,
        projectId: configEntity.projectId,
        repoOwner: configEntity.repoOwner,
        repoName: configEntity.repoName,
        hasToken: !!configEntity.encryptedPat,
        createdAt: configEntity.createdAt.toISOString(),
        updatedAt: configEntity.updatedAt.toISOString(),
      }
    : null;

  // Fetch GitHub issues
  const { GitHubIssue } = await import("@/lib/db/entities/GitHubIssue");
  const issueEntities = await db.getRepository(GitHubIssue).find({
    where: { projectId: id },
    order: { createdAt: "DESC" },
  });
  const initialIssues = issueEntities.map((i) => ({
    id: i.id,
    githubIssueNumber: i.githubIssueNumber,
    githubUrl: i.githubUrl,
    title: i.title,
    labels: i.labels,
    status: i.status || "open",
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <GitHubClient
      initialConfig={initialConfig}
      initialIssues={initialIssues}
      projectId={id}
    />
  );
}
