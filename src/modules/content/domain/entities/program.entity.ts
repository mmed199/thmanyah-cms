import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ProgramType } from "../enums/program-type.enum";
import { Category } from "../enums/category.enum";
import { Status } from "../enums/status.enum";
import { Content } from "./content.entity";

export interface ProgramMetadata {
  hostName?: string;
  rssFeedUrl?: string;
  totalEpisodes?: number;
  coverImageUrl?: string;
  [key: string]: unknown;
}

@Entity("programs")
export class Program {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ProgramType,
  })
  type: ProgramType;

  @Column({
    type: "enum",
    enum: Category,
  })
  category: Category;

  @Column({ type: "varchar", length: 10, default: "ar" })
  language: string;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.DRAFT,
  })
  status: Status;

  @Column({ type: "jsonb", nullable: true })
  metadata: ProgramMetadata;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Content, (content) => content.program)
  contents: Content[];
}
