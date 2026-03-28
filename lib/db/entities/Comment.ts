import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";
import { Category } from "./Category";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "int" })
  rowIndex!: number;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  rawData!: string | null; // JSON string — full original CSV row

  @Column({ type: "int", nullable: true })
  npsScore!: number | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  commentText!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, (c) => c.comments, { nullable: true })
  @JoinColumn({ name: "categoryId" })
  category!: Category | null;

  @Column({ type: "bit", default: true })
  isActionable!: boolean;

  @Column({ type: "bit", default: false })
  isNoise!: boolean;

  @Column({ type: "bit", default: true })
  hasComment!: boolean;

  @Column({ type: "float", nullable: true })
  aiConfidence!: number | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  aiReasoning!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  metadata!: string | null; // JSON string — dynamic columns
}
