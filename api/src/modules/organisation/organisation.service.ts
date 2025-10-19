import { ObjectId } from 'mongodb';
import {
  CreateOrganisationInput,
  OrganisationDocument,
  OrganisationStatus,
  UpdateOrganisationInput
} from './organisation.model';
import {
  CreateOrganisationDoc,
  OrganisationRepository
} from './organisation.repository';

export type OrganisationResponse = {
  id: string;
  name: string;
  slug: string;
  status: OrganisationStatus;
  createdAt: string;
  updatedAt: string;
};

export class OrganisationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganisationError';
  }
}

export class InvalidOrganisationIdError extends OrganisationError {
  constructor() {
    super('Invalid organisation id');
    this.name = 'InvalidOrganisationIdError';
  }
}

export class OrganisationNotFoundError extends OrganisationError {
  constructor() {
    super('Organisation not found');
    this.name = 'OrganisationNotFoundError';
  }
}

export class OrganisationSlugTakenError extends OrganisationError {
  constructor() {
    super('Organisation slug already exists');
    this.name = 'OrganisationSlugTakenError';
  }
}

const toOrganisationResponse = (
  organisation: OrganisationDocument
): OrganisationResponse => ({
  id: organisation._id.toHexString(),
  name: organisation.name,
  slug: organisation.slug,
  status: organisation.status,
  createdAt: organisation.createdAt.toISOString(),
  updatedAt: organisation.updatedAt.toISOString()
});

const normaliseSlug = (slug: string) => slug.trim().toLowerCase();

const normaliseName = (name: string) => name.trim();

const parseObjectId = (id: string): ObjectId => {
  if (!ObjectId.isValid(id)) {
    throw new InvalidOrganisationIdError();
  }

  return new ObjectId(id);
};

export class OrganisationService {
  constructor(private readonly repository: OrganisationRepository) {}

  async list(
    status?: OrganisationStatus
  ): Promise<OrganisationResponse[]> {
    const organisations = await this.repository.findAll(status);
    return organisations.map(toOrganisationResponse);
  }

  async getById(id: string): Promise<OrganisationResponse> {
    const objectId = parseObjectId(id);
    const organisation = await this.repository.findById(objectId);

    if (!organisation) {
      throw new OrganisationNotFoundError();
    }

    return toOrganisationResponse(organisation);
  }

  async create(input: CreateOrganisationInput): Promise<OrganisationResponse> {
    const now = new Date();

    const name = normaliseName(input.name);
    const slug = normaliseSlug(input.slug);

    const existing = await this.repository.findBySlug(slug);

    if (existing) {
      throw new OrganisationSlugTakenError();
    }

    const organisationToCreate: CreateOrganisationDoc = {
      name,
      slug,
      status: input.status ?? 'active',
      createdAt: now,
      updatedAt: now
    };

    const organisation = await this.repository.create(organisationToCreate);

    return toOrganisationResponse(organisation);
  }

  async update(
    id: string,
    input: UpdateOrganisationInput
  ): Promise<OrganisationResponse> {
    const objectId = parseObjectId(id);
    const organisation = await this.repository.findById(objectId);

    if (!organisation) {
      throw new OrganisationNotFoundError();
    }

    const payload: Record<string, unknown> = {};

    if (input.name !== undefined) {
      payload.name = normaliseName(input.name);
    }

    if (input.slug !== undefined) {
      const slug = normaliseSlug(input.slug);

      if (slug !== organisation.slug) {
        const existing = await this.repository.findBySlug(slug);

        if (existing && !existing._id.equals(organisation._id)) {
          throw new OrganisationSlugTakenError();
        }
      }

      payload.slug = normaliseSlug(input.slug);
    }

    if (input.status !== undefined) {
      payload.status = input.status;
    }

    payload.updatedAt = new Date();

    const updated = await this.repository.updateById(
      organisation._id,
      payload
    );

    if (!updated) {
      throw new OrganisationNotFoundError();
    }

    return toOrganisationResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const objectId = parseObjectId(id);
    const deleted = await this.repository.deleteById(objectId);

    if (!deleted) {
      throw new OrganisationNotFoundError();
    }
  }
}
