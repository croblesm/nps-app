import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", "categories", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  sampleComments!: string | null;

  @Column({ type: "bit", default: false })
  isFallback!: boolean;

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "nvarchar", length: 10, default: "ai" })
  createdBy!: string;

  @OneToMany("Comment", "category")
  comments!: unknown[];
}
