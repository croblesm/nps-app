import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  password!: string | null;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  image!: string | null;

  @Column({ type: "datetime2", nullable: true })
  emailVerified!: Date | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}
