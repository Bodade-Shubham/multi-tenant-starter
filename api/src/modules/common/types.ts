import { ObjectId } from 'mongodb';

export type DocumentId = ObjectId;

export interface BaseDocument {
  _id: DocumentId;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentStatus = 'active' | 'inactive' | 'archived';
