import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("github_issues")
export class GitHubIssue {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @Column({ type: "uniqueidentifier", nullable: true })
  categoryId!: string | null;

  @Column({ type: "int" })
  githubIssueNumber!: number;

  @Column({ type: "nvarchar", length: 500 })
  githubUrl!: string;

  @Column({ type: "nvarchar", length: 500 })
  title!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  labels!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "'open'" })
  status!: string;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}
