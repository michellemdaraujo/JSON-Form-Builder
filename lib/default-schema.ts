import type { FormSchema } from "@/types/form-schema";

export const DEFAULT_SCHEMA: FormSchema = {
  version: 1,
  title: "Contact Form",
  fields: [
    {
      id: "field-1",
      label: "Full Name",
      name: "fullName",
      type: "text",
      placeholder: "Enter your full name",
      required: true,
      validation: { min: 2, max: 100 },
    },
    {
      id: "field-2",
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "you@example.com",
      required: true,
      validation: { custom: "email" },
    },
    {
      id: "field-3",
      label: "Country",
      name: "country",
      type: "select",
      required: true,
      options: [
        { label: "United States", value: "US" },
        { label: "Canada", value: "CA" },
        { label: "United Kingdom", value: "UK" },
      ],
    },
    {
      id: "field-4",
      label: "State",
      name: "state",
      type: "text",
      placeholder: "Enter your state",
      required: false,
      conditionalVisibility: { fieldName: "country", value: "US" },
    },
    {
      id: "field-5",
      label: "Message",
      name: "message",
      type: "textarea",
      placeholder: "How can we help?",
      helpText: "Please provide as much detail as possible.",
      required: true,
      validation: { min: 10, max: 500 },
    },
  ],
};
