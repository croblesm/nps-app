import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { generateObject } from "ai";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
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

  // Determine issue type via LLM analysis
  let issueType: "bug" | "feature-request" | "feedback" = "feedback";
  try {
    const model = await getActiveModel();
    const sampleText = topComments.map((c) => c.text).join("\n");
    const { object } = await generateObject({
      model,
      schema: z.object({
        type: z.enum(["bug", "feature-request", "feedback"]),
      }),
      prompt: `Classify the following NPS feedback into one of: "bug" (reports a defect or error), "feature-request" (asks for new functionality), or "feedback" (general opinion/praise/complaint). Category: "${categoryName}". Comments:\n${sampleText}`,
    });
    issueType = object.type;
  } catch {
    // Fallback to "feedback" if LLM is unavailable
  }

  // Auto-create labels if they don't exist
  const labels = ["nps-feedback", categoryName.toLowerCase().replace(/\s+/g, "-")];
  if (issueType !== "feedback") {
    labels.push(issueType);
  }
  for (const label of labels) {
    try {
      await octokit.issues.getLabel({ owner, repo, name: label });
    } catch {
      try {
        await octokit.issues.createLabel({
          owner,
          repo,
          name: label,
          color: label === "nps-feedback" ? "7057ff" : label === "bug" ? "d73a4a" : label === "feature-request" ? "a2eeef" : "0075ca",
          description:
            label === "nps-feedback"
              ? "Generated from NPS survey feedback"
              : label === "bug"
              ? "Something isn't working"
              : label === "feature-request"
              ? "New feature or enhancement request"
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
    projectId: id,
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
      status: ghIssue.data.state || "open",
    })
  );

  return NextResponse.json(saved, { status: 201 });
}

// Refresh issue statuses from GitHub API
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const { GitHubConfig } = await import("@/lib/db/entities/GitHubConfig");
  const config = await db.getRepository(GitHubConfig).findOneBy({ projectId: id });
  if (!config || !config.encryptedPat) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 400 });
  }

  const pat = decrypt(config.encryptedPat);
  const octokit = new Octokit({ auth: pat });

  const { GitHubIssue } = await import("@/lib/db/entities/GitHubIssue");
  const issueRepo = db.getRepository(GitHubIssue);
  const issues = await issueRepo.find({ where: { projectId: id } });

  let updated = 0;
  for (const issue of issues) {
    try {
      const { data } = await octokit.issues.get({
        owner: config.repoOwner,
        repo: config.repoName,
        issue_number: issue.githubIssueNumber,
      });
      if (data.state !== issue.status) {
        issue.status = data.state;
        await issueRepo.save(issue);
        updated++;
      }
    } catch {
      // Skip issues that can't be fetched
    }
  }

  return NextResponse.json({ updated, total: issues.length });
}
