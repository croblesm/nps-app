import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Project } from "./Project";
import { Comment } from "./Comment";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  sampleComments!: string | null; // JSON string

  @Column({ type: "bit", default: false })
  isFallback!: boolean;

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "nvarchar", length: 10, default: "ai" })
  createdBy!: string;

  @OneToMany(() => Comment, (c) => c.category)
  comments!: Comment[];
}
