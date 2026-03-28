import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { DataSource as DataSourceEntity } from "./DataSource";
import { Category } from "./Category";
import { NoiseFilter } from "./NoiseFilter";
import { Comment } from "./Comment";
import { Summary } from "./Summary";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  llmProvider!: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  llmModel!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime2" })
  updatedAt!: Date;

  @OneToMany(() => DataSourceEntity, (ds) => ds.project)
  dataSources!: DataSourceEntity[];

  @OneToMany(() => Category, (c) => c.project)
  categories!: Category[];

  @OneToMany(() => NoiseFilter, (nf) => nf.project)
  noiseFilters!: NoiseFilter[];

  @OneToMany(() => Comment, (c) => c.project)
  comments!: Comment[];

  @OneToMany(() => Summary, (s) => s.project)
  summaries!: Summary[];
}
