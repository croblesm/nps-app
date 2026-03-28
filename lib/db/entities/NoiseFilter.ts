import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";

@Entity("noise_filters")
export class NoiseFilter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.noiseFilters, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  filterKeywords!: string | null; // JSON string

  @Column({ type: "bit", default: false })
  excludeFromNps!: boolean;

  @Column({ type: "bit", default: true })
  isActive!: boolean;
}
