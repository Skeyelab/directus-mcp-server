export interface DirectusConfig {
  url: string;
  token?: string;
  email?: string;
  password?: string;
}

export interface DirectusCollection {
  collection: string;
  meta?: {
    collection: string;
    icon?: string;
    note?: string;
    display_template?: string;
    hidden: boolean;
    singleton: boolean;
    translations?: any;
    archive_field?: string;
    archive_app_filter: boolean;
    archive_value?: string;
    unarchive_value?: string;
    sort_field?: string;
    accountability?: string;
    color?: string;
    item_duplication_fields?: string[];
    sort?: number;
    group?: string;
    collapse: string;
  };
  schema?: {
    name: string;
    comment?: string;
  };
}

export interface DirectusField {
  collection: string;
  field: string;
  type: string;
  schema?: {
    name?: string;
    table?: string;
    data_type?: string;
    default_value?: any;
    max_length?: number;
    numeric_precision?: number;
    numeric_scale?: number;
    is_nullable?: boolean;
    is_unique?: boolean;
    is_primary_key?: boolean;
    has_auto_increment?: boolean;
    foreign_key_column?: string;
    foreign_key_table?: string;
    comment?: string;
  };
  meta?: {
    id?: number;
    collection: string;
    field: string;
    special?: string[];
    interface?: string;
    options?: any;
    display?: string;
    display_options?: any;
    readonly?: boolean;
    hidden?: boolean;
    sort?: number;
    width?: string;
    translations?: any;
    note?: string;
    conditions?: any;
    required?: boolean;
    group?: string;
    validation?: any;
    validation_message?: string;
  };
}

export interface DirectusRelation {
  collection: string;
  field: string;
  related_collection?: string;
  schema?: {
    constraint_name?: string;
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    on_update: string;
    on_delete: string;
  };
  meta?: {
    id?: number;
    many_collection: string;
    many_field: string;
    one_collection?: string;
    one_field?: string;
    one_collection_field?: string;
    one_allowed_collections?: string[];
    junction_field?: string;
    sort_field?: string;
    one_deselect_action?: string;
  };
}

export interface QueryParams {
  fields?: string[];
  filter?: Record<string, any>;
  search?: string;
  sort?: string[];
  limit?: number;
  offset?: number;
  page?: number;
  aggregate?: Record<string, any>;
  groupBy?: string[];
  deep?: Record<string, any>;
}

export type Toolset = 'default' | 'schema' | 'content' | 'flow';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  toolsets: Toolset[];
  handler: (client: any, args: any) => Promise<any>;
}

