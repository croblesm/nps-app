import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";

@Entity("summaries")
export class Summary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.summaries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  markdownContent!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  generatedAt!: Date;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  modelUsed!: string | null;
}
