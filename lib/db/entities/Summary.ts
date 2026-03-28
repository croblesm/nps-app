import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("summaries")
export class Summary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", "summaries", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  markdownContent!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  generatedAt!: Date;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  modelUsed!: string | null;
}
