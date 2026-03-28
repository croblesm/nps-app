import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("noise_filters")
export class NoiseFilter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @ManyToOne("Project", "noiseFilters", { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project!: unknown;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  filterKeywords!: string | null;

  @Column({ type: "bit", default: false })
  excludeFromNps!: boolean;

  @Column({ type: "bit", default: true })
  isActive!: boolean;
}
