import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("llm_configs")
export class LlmConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 50 })
  provider!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  apiKeyEncrypted!: string | null;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  endpointUrl!: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  modelName!: string | null;

  @Column({ type: "bit", default: false })
  isDefault!: boolean;
}
