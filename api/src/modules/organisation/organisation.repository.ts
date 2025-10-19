import { Collection, Db, ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import {
  OrganisationDocument,
  OrganisationStatus,
  organisationCollection
} from './organisation.model';

export type CreateOrganisationDoc = Omit<OrganisationDocument, '_id'>;

export type UpdateOrganisationDoc = Partial<
  Omit<OrganisationDocument, '_id' | 'createdAt'>
>;

export class OrganisationRepository {
  private readonly collection: Collection<OrganisationDocument>;

  constructor(db: Db) {
    this.collection = db.collection<OrganisationDocument>(organisationCollection);
  }

  async findAll(status?: OrganisationStatus): Promise<OrganisationDocument[]> {
    const filter = status ? { status } : {};
    return this.collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  async findById(id: ObjectId): Promise<OrganisationDocument | null> {
    return this.collection.findOne({ _id: id });
  }

  async findBySlug(slug: string): Promise<OrganisationDocument | null> {
    return this.collection.findOne({ slug });
  }

  async create(
    payload: CreateOrganisationDoc
  ): Promise<OrganisationDocument> {
    const result = await this.collection.insertOne(
      payload as OptionalUnlessRequiredId<OrganisationDocument>
    );

    return {
      _id: result.insertedId,
      ...payload
    };
  }

  async updateById(
    id: ObjectId,
    payload: UpdateOrganisationDoc
  ): Promise<OrganisationDocument | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: payload },
      { returnDocument: 'after' }
    );

    return result;
  }

  async deleteById(id: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}
