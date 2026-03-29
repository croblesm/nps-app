import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", "comments", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "int" })
  rowIndex!: number;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  rawData!: string | null;

  @Column({ type: "int", nullable: true })
  npsScore!: number | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  commentText!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  categoryId!: string | null;

  @ManyToOne("Category", "comments", { nullable: true })
  @JoinColumn({ name: "categoryId" })
  category!: { name: string } | null;

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
  metadata!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  embedding!: string | null;
}
