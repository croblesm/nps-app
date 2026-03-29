import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { getDb } from "@/lib/db";
import { parseBody, githubConfigSchema } from "@/lib/api/schemas";
import { encrypt } from "@/lib/ai/encryption";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { GitHubConfig } = await import("@/lib/db/entities/GitHubConfig");

  const config = await db
    .getRepository(GitHubConfig)
    .findOneBy({ projectId: id });

  if (!config) {
    return NextResponse.json(null);
  }

  // Never return the encrypted PAT to the client
  return NextResponse.json({
    id: config.id,
    projectId: config.projectId,
    repoOwner: config.repoOwner,
    repoName: config.repoName,
    hasToken: !!config.encryptedPat,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = await parseBody(request, githubConfigSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { repoOwner, repoName, pat } = parsed.data;

  // Validate PAT by calling the GitHub API
  const octokit = new Octokit({ auth: pat });
  try {
    await octokit.repos.get({ owner: repoOwner, repo: repoName });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to validate GitHub token";
    return NextResponse.json(
      { error: `GitHub validation failed: ${message}` },
      { status: 400 }
    );
  }

  // Encrypt and save
  const encryptedPat = encrypt(pat);
  const db = await getDb();
  const { GitHubConfig } = await import("@/lib/db/entities/GitHubConfig");
  const repo = db.getRepository(GitHubConfig);

  let config = await repo.findOneBy({ projectId: id });
  if (config) {
    config.repoOwner = repoOwner;
    config.repoName = repoName;
    config.encryptedPat = encryptedPat;
  } else {
    config = repo.create({
      projectId: id,
      repoOwner,
      repoName,
      encryptedPat,
    });
  }

  await repo.save(config);

  return NextResponse.json({
    id: config.id,
    projectId: config.projectId,
    repoOwner: config.repoOwner,
    repoName: config.repoName,
    hasToken: true,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  });
}
