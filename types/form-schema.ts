export const FIELD_TYPES = {
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  select: "Select",
  radio: "Radio",
  checkbox: "Checkbox",
  date: "Date",
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

export const CUSTOM_RULES = {
  email: "Email",
  url: "URL",
  lettersOnly: "Letters only",
} as const;

export type CustomRule = keyof typeof CUSTOM_RULES;

export type FieldOption = {
  label: string;
  value: string;
};

export type ValidationRule = {
  min?: number;
  max?: number;
  regex?: string;
  custom?: CustomRule;
};

export type ConditionalVisibility = {
  fieldName: string;
  value: string | number | boolean;
};

type BaseField = {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: ValidationRule;
  conditionalVisibility?: ConditionalVisibility;
};

export type TextField = BaseField & {
  type: "text" | "textarea";
  defaultValue?: string;
};

export type NumberField = BaseField & {
  type: "number";
  defaultValue?: number;
};

export type CheckboxField = BaseField & {
  type: "checkbox";
  options: FieldOption[];
  defaultValue?: string[];
};

export type DateField = BaseField & {
  type: "date";
  defaultValue?: string;
};

export type ChoiceField = BaseField & {
  type: "select" | "radio";
  options: FieldOption[];
  defaultValue?: string;
};

export type FormField =
  | TextField
  | NumberField
  | CheckboxField
  | DateField
  | ChoiceField;

export type FormSchema = {
  version: 1;
  title: string;
  fields: FormField[];
};
