import type { FormTypeDef } from "./types";

export const CICATRICES: FormTypeDef = {
  type: "cicatrices",
  label: "Cicatrices",
  icon: "Scissors",
  color: "orange",
  description: "Evaluacion de cicatrices post-cirugia o traumaticas",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Antecedentes",
      icon: "ClipboardList",
      fields: [
        { key: "surgical_history", label: "Antecedentes quirurgicos", type: "textarea", placeholder: "Describa cirugias previas..." },
        { key: "scar_origin", label: "Origen de la cicatriz", type: "text", placeholder: "Ej: Cirugia, accidente, quemadura..." },
        { key: "scar_age", label: "Tiempo de la cicatriz", type: "text", placeholder: "Ej: 6 meses, 2 anos..." },
      ],
    },
    {
      title: "Evaluacion de la Cicatriz",
      icon: "ClipboardList",
      fields: [
        { key: "location", label: "Localizacion", type: "text", placeholder: "Ej: Abdomen, rostro, brazo..." },
        {
          key: "scar_type", label: "Tipo de cicatriz", type: "select",
          options: [
            { value: "hypertrophic", label: "Hipertrofica" },
            { value: "keloid", label: "Queloide" },
            { value: "atrophic", label: "Atrofica" },
            { value: "flat", label: "Plana" },
            { value: "contracture", label: "Contractura" },
          ],
        },
        {
          key: "scar_texture", label: "Textura", type: "select",
          options: [
            { value: "smooth", label: "Lisa" },
            { value: "rough", label: "Rugosa" },
            { value: "irregular", label: "Irregular" },
          ],
        },
        {
          key: "scar_color", label: "Color de la cicatriz", type: "select",
          options: [
            { value: "red", label: "Roja/rosada" },
            { value: "purple", label: "Morada" },
            { value: "brown", label: "Marron/hiperpigmentada" },
            { value: "white", label: "Blanca/hipopigmentada" },
            { value: "skin_tone", label: "Similar al tono de piel" },
          ],
        },
        {
          key: "scar_relief", label: "Relieve", type: "radio",
          options: [
            { value: "raised", label: "Elevada" },
            { value: "flat", label: "Plana" },
            { value: "depressed", label: "Hundida" },
          ],
        },
        { key: "scar_size", label: "Tamano aproximado (cm)", type: "text", placeholder: "Ej: 5cm x 2cm" },
        {
          key: "aesthetic_impact", label: "Impacto estetico", type: "radio",
          options: [
            { value: "mild", label: "Leve" },
            { value: "moderate", label: "Moderado" },
            { value: "severe", label: "Severo" },
          ],
        },
      ],
    },
    {
      title: "Tratamiento",
      icon: "ClipboardList",
      fields: [
        { key: "previous_scar_treatments", label: "Tratamientos previos para la cicatriz", type: "textarea" },
        { key: "proposed_treatment", label: "Tratamiento propuesto", type: "textarea" },
      ],
    },
  ],
};

export const PIGMENTACION: FormTypeDef = {
  type: "pigmentacion",
  label: "Pigmentacion Corporal",
  icon: "Palette",
  color: "teal",
  description: "Evaluacion de manchas, melasma y alteraciones de pigmento",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea" },
      ],
    },
    {
      title: "Evaluacion de Pigmentacion",
      icon: "Palette",
      fields: [
        { key: "affected_zones", label: "Zonas afectadas", type: "textarea", placeholder: "Ej: Mejillas, frente, manos, axilas..." },
        { key: "pigmentation_cause", label: "Posible causa de la pigmentacion", type: "text", placeholder: "Ej: Sol, hormonal, post-inflamatoria..." },
        {
          key: "phototype", label: "Fototipo de piel", type: "select",
          options: [
            { value: "I", label: "I - Muy clara" },
            { value: "II", label: "II - Clara" },
            { value: "III", label: "III - Intermedia" },
            { value: "IV", label: "IV - Morena" },
            { value: "V", label: "V - Oscura" },
            { value: "VI", label: "VI - Muy oscura" },
          ],
        },
        {
          key: "pigmentation_type", label: "Tipo de pigmentacion", type: "select",
          options: [
            { value: "melasma", label: "Melasma" },
            { value: "solar", label: "Manchas solares (lentigos)" },
            { value: "pih", label: "Post-inflamatoria (PIH)" },
            { value: "hormonal", label: "Hormonal" },
            { value: "other", label: "Otra" },
          ],
        },
        {
          key: "pigmentation_grade", label: "Grado de pigmentacion", type: "radio",
          options: [
            { value: "mild", label: "Leve" },
            { value: "moderate", label: "Moderado" },
            { value: "severe", label: "Severo" },
          ],
        },
      ],
    },
    {
      title: "Antecedentes y Tratamiento",
      icon: "ClipboardList",
      fields: [
        { key: "uses_sunscreen", label: "Usa protector solar diario", type: "boolean" },
        { key: "sun_exposure", label: "Exposicion solar frecuente", type: "boolean" },
        { key: "hormonal_treatment", label: "Tratamiento hormonal (anticonceptivos, etc)", type: "boolean" },
        { key: "previous_pigment_treatments", label: "Tratamientos previos para pigmentacion", type: "textarea" },
        { key: "proposed_treatment", label: "Tratamiento propuesto", type: "textarea" },
      ],
    },
  ],
};

export const CORPORAL: FormTypeDef = {
  type: "corporal",
  label: "Corporal",
  icon: "Activity",
  color: "amber",
  description: "Evaluacion corporal, medidas, celulitis, flacidez y adiposidad",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea" },
      ],
    },
    {
      title: "Medidas Corporales",
      icon: "Activity",
      fields: [
        { key: "weight", label: "Peso (kg)", type: "number", placeholder: "0" },
        { key: "height", label: "Estatura (cm)", type: "number", placeholder: "0" },
        { key: "waist", label: "Cintura (cm)", type: "number", placeholder: "0" },
        { key: "hip", label: "Cadera (cm)", type: "number", placeholder: "0" },
        { key: "thigh_r", label: "Muslo derecho (cm)", type: "number", placeholder: "0" },
        { key: "thigh_l", label: "Muslo izquierdo (cm)", type: "number", placeholder: "0" },
        { key: "arm_r", label: "Brazo derecho (cm)", type: "number", placeholder: "0" },
        { key: "arm_l", label: "Brazo izquierdo (cm)", type: "number", placeholder: "0" },
      ],
    },
    {
      title: "Estado General y Habitos",
      icon: "ClipboardList",
      fields: [
        { key: "takes_medication", label: "Toma medicamentos", type: "boolean" },
        { key: "medication_details", label: "Cuales medicamentos", type: "text", conditionalOn: "takes_medication" },
        { key: "hormonal_treatment", label: "Tratamiento hormonal", type: "boolean" },
        { key: "pregnancy_lactation", label: "Embarazo o lactancia", type: "boolean" },
        {
          key: "diet_quality", label: "Alimentacion", type: "radio",
          options: [
            { value: "balanced", label: "Balanceada" },
            { value: "irregular", label: "Irregular" },
            { value: "poor", label: "Deficiente" },
          ],
        },
        {
          key: "exercise_frequency", label: "Actividad fisica", type: "radio",
          options: [
            { value: "regular", label: "Regular (3+ veces/semana)" },
            { value: "occasional", label: "Ocasional (1-2 veces/semana)" },
            { value: "sedentary", label: "Sedentario" },
          ],
        },
        {
          key: "water_intake", label: "Consumo de agua", type: "radio",
          options: [
            { value: "adequate", label: "Adecuado (2+ litros)" },
            { value: "moderate", label: "Moderado (1-2 litros)" },
            { value: "insufficient", label: "Insuficiente (-1 litro)" },
          ],
        },
      ],
    },
    {
      title: "Evaluacion Corporal",
      icon: "ClipboardList",
      fields: [
        {
          key: "cellulite_grade", label: "Grado de celulitis", type: "select",
          options: [
            { value: "none", label: "Sin celulitis" },
            { value: "grade1", label: "Grado I (visible al pellizcar)" },
            { value: "grade2", label: "Grado II (visible de pie)" },
            { value: "grade3", label: "Grado III (visible siempre)" },
          ],
        },
        { key: "has_flaccidity", label: "Flacidez", type: "boolean" },
        { key: "flaccidity_areas", label: "Areas con flacidez", type: "text", conditionalOn: "has_flaccidity" },
        { key: "has_localized_fat", label: "Adiposidad localizada", type: "boolean" },
        { key: "fat_areas", label: "Areas con adiposidad", type: "text", conditionalOn: "has_localized_fat" },
        { key: "has_stretch_marks", label: "Estrias", type: "boolean" },
        { key: "stretch_mark_areas", label: "Areas con estrias", type: "text", conditionalOn: "has_stretch_marks" },
        { key: "body_observations", label: "Observaciones adicionales", type: "textarea" },
      ],
    },
  ],
};

export const MASAJE: FormTypeDef = {
  type: "masaje",
  label: "Masaje",
  icon: "Hand",
  color: "green",
  description: "Evaluacion para sesiones de masaje terapeutico o relajante",
  hasProductRecommendations: false,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "stress", label: "Estres", type: "boolean" },
        { key: "muscle_pain", label: "Dolor muscular", type: "boolean" },
        { key: "fluid_retention", label: "Retencion de liquidos", type: "boolean" },
        { key: "relaxation", label: "Relajacion", type: "boolean" },
        { key: "other_reason", label: "Otro motivo", type: "text", placeholder: "Especifique..." },
      ],
    },
    {
      title: "Estilo de Vida",
      icon: "ClipboardList",
      fields: [
        {
          key: "work_type", label: "Tipo de trabajo", type: "radio",
          options: [
            { value: "sedentary", label: "Sedentario (oficina)" },
            { value: "standing", label: "De pie" },
            { value: "physical", label: "Fisico/manual" },
            { value: "mixed", label: "Mixto" },
          ],
        },
        {
          key: "stress_level", label: "Nivel de estres", type: "radio",
          options: [
            { value: "low", label: "Bajo" },
            { value: "moderate", label: "Moderado" },
            { value: "high", label: "Alto" },
          ],
        },
        {
          key: "sleep_quality", label: "Calidad del sueno", type: "radio",
          options: [
            { value: "good", label: "Buena" },
            { value: "regular", label: "Regular" },
            { value: "poor", label: "Mala" },
          ],
        },
        { key: "exercises", label: "Realiza ejercicio", type: "boolean" },
      ],
    },
    {
      title: "Areas de Tension y Dolor",
      icon: "Hand",
      fields: [
        { key: "neck_tension", label: "Cuello", type: "boolean" },
        { key: "shoulder_tension", label: "Hombros", type: "boolean" },
        { key: "upper_back_tension", label: "Espalda alta", type: "boolean" },
        { key: "lower_back_tension", label: "Espalda baja (lumbar)", type: "boolean" },
        { key: "legs_tension", label: "Piernas", type: "boolean" },
        { key: "other_tension_areas", label: "Otras areas de tension", type: "text" },
        { key: "pain_observations", label: "Observaciones sobre el dolor", type: "textarea" },
      ],
    },
    {
      title: "Contraindicaciones",
      icon: "ClipboardList",
      fields: [
        { key: "has_heart_condition", label: "Problemas cardiacos", type: "boolean" },
        { key: "has_varicose_veins", label: "Varices", type: "boolean" },
        { key: "has_skin_conditions", label: "Afecciones cutaneas en zona a tratar", type: "boolean" },
        { key: "recent_surgery", label: "Cirugia reciente", type: "boolean" },
        { key: "surgery_details", label: "Detalles de la cirugia", type: "text", conditionalOn: "recent_surgery" },
        { key: "pregnancy_lactation", label: "Embarazo", type: "boolean" },
        { key: "other_contraindications", label: "Otras contraindicaciones", type: "textarea" },
      ],
    },
  ],
};
