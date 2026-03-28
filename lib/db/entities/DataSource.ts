import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("data_sources")
export class DataSource {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", "dataSources", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "nvarchar", length: 500 })
  filename!: string;

  @Column({ type: "int", nullable: true })
  rowCount!: number | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  columns!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "pending" })
  validationStatus!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  validationNotes!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  uploadedAt!: Date;
}
