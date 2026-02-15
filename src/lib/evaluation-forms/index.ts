export type { FieldDef, SectionDef, FormTypeDef } from "./types";

import { FACIAL, CAPILAR, DEPILACION_LASER, POST_OPERATORIO } from "./skin-forms";
import { CICATRICES, PIGMENTACION, CORPORAL, MASAJE } from "./body-forms";
import type { FormTypeDef } from "./types";

export const FORM_TYPES: FormTypeDef[] = [
  FACIAL,
  CAPILAR,
  DEPILACION_LASER,
  POST_OPERATORIO,
  CICATRICES,
  PIGMENTACION,
  CORPORAL,
  MASAJE,
];

export const FORM_TYPE_MAP: Record<string, FormTypeDef> = Object.fromEntries(
  FORM_TYPES.map((f) => [f.type, f])
);

export function getFormDef(type: string): FormTypeDef | undefined {
  return FORM_TYPE_MAP[type];
}
