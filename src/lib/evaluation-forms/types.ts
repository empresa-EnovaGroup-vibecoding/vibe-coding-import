export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "select" | "radio" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  conditionalOn?: string;
}

export interface SectionDef {
  title: string;
  icon: string;
  fields: FieldDef[];
}

export interface FormTypeDef {
  type: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  sections: SectionDef[];
  hasProductRecommendations: boolean;
}
