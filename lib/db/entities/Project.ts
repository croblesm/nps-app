import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  analysisHints!: string | null;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  llmProvider!: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  llmModel!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime2" })
  updatedAt!: Date;

  @OneToMany("DataSource", "project")
  dataSources!: unknown[];

  @OneToMany("Category", "project")
  categories!: unknown[];

  @OneToMany("NoiseFilter", "project")
  noiseFilters!: unknown[];

  @OneToMany("Comment", "project")
  comments!: unknown[];

  @OneToMany("Summary", "project")
  summaries!: unknown[];
}
