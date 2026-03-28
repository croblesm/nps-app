import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";

@Entity("report_structures")
export class ReportStructure {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  includedColumns!: string | null; // JSON string

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  excludedColumns!: string | null; // JSON string

  @Column({ type: "datetime2", nullable: true })
  confirmedAt!: Date | null;
}
