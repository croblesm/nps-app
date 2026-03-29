import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { getDb } from "@/lib/db";
import { parseBody, createGithubIssueSchema } from "@/lib/api/schemas";
import { decrypt } from "@/lib/ai/encryption";
import { buildIssueBody, buildIssueTitle } from "@/lib/github/issue-template";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { GitHubIssue } = await import("@/lib/db/entities/GitHubIssue");

  const issues = await db.getRepository(GitHubIssue).find({
    where: { projectId: id },
    order: { createdAt: "DESC" },
  });

  return NextResponse.json(issues);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = await parseBody(request, createGithubIssueSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { categoryId, categoryName, commentCount, npsImpact, topComments, recommendation } =
    parsed.data;

  // Load GitHub config
  const db = await getDb();
  const { GitHubConfig } = await import("@/lib/db/entities/GitHubConfig");
  const config = await db
    .getRepository(GitHubConfig)
    .findOneBy({ projectId: id });

  if (!config || !config.encryptedPat) {
    return NextResponse.json(
      { error: "GitHub is not configured for this project" },
      { status: 400 }
    );
  }

  const pat = decrypt(config.encryptedPat);
  const octokit = new Octokit({ auth: pat });
  const owner = config.repoOwner;
  const repo = config.repoName;

  // Auto-create labels if they don't exist
  const labels = ["nps-feedback", categoryName.toLowerCase().replace(/\s+/g, "-")];
  for (const label of labels) {
    try {
      await octokit.issues.getLabel({ owner, repo, name: label });
    } catch {
      try {
        await octokit.issues.createLabel({
          owner,
          repo,
          name: label,
          color: label === "nps-feedback" ? "7057ff" : "0075ca",
          description:
            label === "nps-feedback"
              ? "Generated from NPS survey feedback"
              : `NPS category: ${categoryName}`,
        });
      } catch {
        // Label creation may fail if we lack permissions; continue anyway
      }
    }
  }

  // Create the issue
  const title = buildIssueTitle(categoryName);
  const body = buildIssueBody({
    categoryName,
    commentCount,
    npsImpact,
    topComments,
    recommendation,
  });

  let ghIssue;
  try {
    ghIssue = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create GitHub issue";
    return NextResponse.json(
      { error: `GitHub issue creation failed: ${message}` },
      { status: 500 }
    );
  }

  // Save record
  const { GitHubIssue } = await import("@/lib/db/entities/GitHubIssue");
  const issueRepo = db.getRepository(GitHubIssue);
  const saved = await issueRepo.save(
    issueRepo.create({
      projectId: id,
      categoryId: categoryId ?? null,
      githubIssueNumber: ghIssue.data.number,
      githubUrl: ghIssue.data.html_url,
      title: ghIssue.data.title,
      labels: JSON.stringify(labels),
    })
  );

  return NextResponse.json(saved, { status: 201 });
}
