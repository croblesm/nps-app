import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("github_configs")
export class GitHubConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @Column({ type: "nvarchar", length: 255 })
  repoOwner!: string;

  @Column({ type: "nvarchar", length: 255 })
  repoName!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  encryptedPat!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime2" })
  updatedAt!: Date;
}
