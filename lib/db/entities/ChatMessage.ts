import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  projectId!: string;

  @Column({ type: "nvarchar", length: 20 })
  role!: string; // "user" or "assistant"

  @Column({ type: "nvarchar", length: "MAX" })
  content!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  citations!: string | null; // JSON array of comment IDs

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}
