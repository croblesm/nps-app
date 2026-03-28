import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("report_structures")
export class ReportStructure {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  includedColumns!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  excludedColumns!: string | null;

  @Column({ type: "datetime2", nullable: true })
  confirmedAt!: Date | null;
}
