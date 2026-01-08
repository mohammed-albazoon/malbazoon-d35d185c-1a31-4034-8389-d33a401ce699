export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationCreate {
  name: string;
  description?: string;
  parentId?: string;
}

export interface IOrganizationHierarchy extends IOrganization {
  children?: IOrganizationHierarchy[];
  parent?: IOrganization;
}
