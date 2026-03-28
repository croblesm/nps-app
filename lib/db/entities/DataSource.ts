import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";

@Entity("data_sources")
export class DataSource {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.dataSources, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "nvarchar", length: 500 })
  filename!: string;

  @Column({ type: "int", nullable: true })
  rowCount!: number | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  columns!: string | null; // JSON string

  @Column({ type: "nvarchar", length: 20, default: "pending" })
  validationStatus!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  validationNotes!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  uploadedAt!: Date;
}
