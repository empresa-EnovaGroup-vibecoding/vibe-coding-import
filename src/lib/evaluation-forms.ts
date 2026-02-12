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

// ─── FACIAL ───────────────────────────────────────────
const FACIAL: FormTypeDef = {
  type: "facial",
  label: "Facial",
  icon: "Sparkles",
  color: "pink",
  description: "Evaluacion de piel, rutina skincare y tratamiento facial",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", placeholder: "Describa el motivo de la visita..." },
      ],
    },
    {
      title: "Datos Medicos y Antecedentes",
      icon: "ClipboardList",
      fields: [
        { key: "has_skin_disease", label: "Enfermedad dermatologica", type: "boolean" },
        { key: "skin_disease_details", label: "Cual enfermedad", type: "text", placeholder: "Especifique...", conditionalOn: "has_skin_disease" },
        { key: "has_allergies", label: "Alergias", type: "boolean" },
        { key: "allergy_details", label: "A que es alergico/a", type: "text", placeholder: "Especifique...", conditionalOn: "has_allergies" },
        { key: "takes_medication", label: "Toma medicamentos", type: "boolean" },
        { key: "medication_details", label: "Cuales medicamentos", type: "text", placeholder: "Especifique...", conditionalOn: "takes_medication" },
        { key: "recent_treatments", label: "Tratamientos en los ultimos 6 meses", type: "boolean" },
        { key: "treatment_details", label: "Cuales tratamientos", type: "text", placeholder: "Describa...", conditionalOn: "recent_treatments" },
        { key: "uses_sunscreen", label: "Usa protector solar", type: "boolean" },
        { key: "smokes_alcohol", label: "Fuma o consume alcohol", type: "boolean" },
        { key: "pregnancy_lactation", label: "Embarazo o lactancia", type: "boolean" },
      ],
    },
    {
      title: "Rutina Actual de Skincare",
      icon: "Sparkles",
      fields: [
        {
          key: "cleaning_frequency", label: "Frecuencia de limpieza facial", type: "radio",
          options: [
            { value: "once", label: "1 vez al dia" },
            { value: "twice", label: "2 veces al dia" },
            { value: "occasional", label: "Ocasionalmente" },
          ],
        },
        { key: "cleanser_brand", label: "Marca de limpiador", type: "text", placeholder: "Ej: CeraVe, La Roche-Posay" },
        { key: "serum_brand", label: "Marca de serum", type: "text", placeholder: "Ej: The Ordinary" },
        { key: "cream_brand", label: "Marca de crema", type: "text", placeholder: "Ej: Neutrogena" },
        { key: "sunscreen_brand", label: "Marca de protector solar", type: "text", placeholder: "Ej: Isdin" },
        { key: "uses_makeup", label: "Se maquilla", type: "boolean" },
        { key: "removes_makeup_properly", label: "Se desmaquilla correctamente", type: "boolean" },
        { key: "uses_exfoliants", label: "Usa exfoliantes", type: "boolean" },
      ],
    },
    {
      title: "Evaluacion Profesional en Cabina",
      icon: "ClipboardList",
      fields: [
        {
          key: "skin_biotype", label: "Biotipo cutaneo", type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "dry", label: "Seco" },
            { value: "oily", label: "Graso" },
            { value: "combination", label: "Mixto" },
          ],
        },
        {
          key: "phototype", label: "Fototipo (Fitzpatrick)", type: "select",
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
          key: "skin_type", label: "Tipo de piel", type: "radio",
          options: [
            { value: "normal", label: "Normal" },
            { value: "dry", label: "Seca" },
            { value: "combination", label: "Mixta" },
            { value: "oily", label: "Grasa" },
            { value: "sensitive", label: "Sensible" },
            { value: "acneic", label: "Acneica" },
          ],
        },
        { key: "skin_analysis", label: "Analisis de la piel", type: "textarea", placeholder: "Estado actual, observaciones, areas problematicas..." },
        { key: "treatment_performed", label: "Tratamiento realizado", type: "textarea", placeholder: "Describa el tratamiento, productos y tecnicas aplicadas..." },
      ],
    },
  ],
};

// ─── CAPILAR ──────────────────────────────────────────
const CAPILAR: FormTypeDef = {
  type: "capilar",
  label: "Capilar",
  icon: "Waves",
  color: "purple",
  description: "Evaluacion de cuero cabelludo, cabello y tratamientos capilares",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", placeholder: "Describa el motivo de la visita..." },
      ],
    },
    {
      title: "Antecedentes",
      icon: "ClipboardList",
      fields: [
        { key: "has_scalp_disease", label: "Enfermedad del cuero cabelludo", type: "boolean" },
        { key: "scalp_disease_details", label: "Cual enfermedad", type: "text", conditionalOn: "has_scalp_disease" },
        { key: "takes_medication", label: "Toma medicamentos", type: "boolean" },
        { key: "medication_details", label: "Cuales medicamentos", type: "text", conditionalOn: "takes_medication" },
        { key: "has_allergies", label: "Alergias", type: "boolean" },
        { key: "allergy_details", label: "A que", type: "text", conditionalOn: "has_allergies" },
        { key: "chemical_treatments", label: "Tratamientos quimicos previos (tintes, alisados, permanentes)", type: "boolean" },
        { key: "chemical_details", label: "Cuales tratamientos quimicos", type: "text", conditionalOn: "chemical_treatments" },
      ],
    },
    {
      title: "Habitos Capilares",
      icon: "Waves",
      fields: [
        {
          key: "wash_frequency", label: "Frecuencia de lavado", type: "radio",
          options: [
            { value: "daily", label: "Diario" },
            { value: "every_other", label: "Dia de por medio" },
            { value: "twice_week", label: "2 veces por semana" },
            { value: "once_week", label: "1 vez por semana" },
          ],
        },
        { key: "shampoo_type", label: "Tipo/marca de shampoo", type: "text" },
        { key: "uses_conditioner", label: "Usa acondicionador", type: "boolean" },
        { key: "uses_masks", label: "Usa mascarillas capilares", type: "boolean" },
        { key: "uses_heat_tools", label: "Usa herramientas de calor (plancha, secador)", type: "boolean" },
      ],
    },
    {
      title: "Evaluacion del Cuero Cabelludo",
      icon: "ClipboardList",
      fields: [
        {
          key: "scalp_oiliness", label: "Grasitud del cuero cabelludo", type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "oily", label: "Graso" },
            { value: "dry", label: "Seco" },
          ],
        },
        { key: "has_dandruff", label: "Presencia de caspa", type: "boolean" },
        { key: "scalp_sensitivity", label: "Sensibilidad del cuero cabelludo", type: "boolean" },
        { key: "has_erythema", label: "Eritema (enrojecimiento)", type: "boolean" },
        { key: "hair_loss", label: "Caida de cabello notable", type: "boolean" },
      ],
    },
    {
      title: "Evaluacion del Cabello",
      icon: "ClipboardList",
      fields: [
        {
          key: "hair_texture", label: "Textura", type: "select",
          options: [
            { value: "fine", label: "Fino" },
            { value: "medium", label: "Medio" },
            { value: "thick", label: "Grueso" },
          ],
        },
        {
          key: "hair_elasticity", label: "Elasticidad", type: "select",
          options: [
            { value: "good", label: "Buena" },
            { value: "regular", label: "Regular" },
            { value: "poor", label: "Mala" },
          ],
        },
        {
          key: "hair_porosity", label: "Porosidad", type: "select",
          options: [
            { value: "low", label: "Baja" },
            { value: "medium", label: "Media" },
            { value: "high", label: "Alta" },
          ],
        },
        { key: "split_ends", label: "Puntas abiertas", type: "boolean" },
        { key: "hair_observations", label: "Observaciones del cabello", type: "textarea" },
      ],
    },
  ],
};

// ─── DEPILACION LASER ─────────────────────────────────
const DEPILACION_LASER: FormTypeDef = {
  type: "depilacion_laser",
  label: "Depilacion Laser",
  icon: "Zap",
  color: "blue",
  description: "Evaluacion para tratamiento de depilacion con laser",
  hasProductRecommendations: false,
  sections: [
    {
      title: "Motivo de Consulta",
      icon: "ClipboardList",
      fields: [
        { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea" },
      ],
    },
    {
      title: "Evaluacion del Vello",
      icon: "Zap",
      fields: [
        {
          key: "hair_color", label: "Color del vello", type: "select",
          options: [
            { value: "black", label: "Negro" },
            { value: "dark_brown", label: "Castano oscuro" },
            { value: "light_brown", label: "Castano claro" },
            { value: "blonde", label: "Rubio" },
            { value: "red", label: "Pelirrojo" },
            { value: "gray", label: "Canoso" },
          ],
        },
        {
          key: "hair_thickness", label: "Grosor del vello", type: "radio",
          options: [
            { value: "fine", label: "Fino" },
            { value: "medium", label: "Medio" },
            { value: "thick", label: "Grueso" },
          ],
        },
        {
          key: "hair_density", label: "Densidad del vello", type: "radio",
          options: [
            { value: "sparse", label: "Escaso" },
            { value: "moderate", label: "Moderado" },
            { value: "dense", label: "Denso" },
          ],
        },
      ],
    },
    {
      title: "Datos del Paciente",
      icon: "ClipboardList",
      fields: [
        {
          key: "phototype", label: "Fototipo de piel (Fitzpatrick)", type: "select",
          options: [
            { value: "I", label: "I - Muy clara" },
            { value: "II", label: "II - Clara" },
            { value: "III", label: "III - Intermedia" },
            { value: "IV", label: "IV - Morena" },
            { value: "V", label: "V - Oscura" },
            { value: "VI", label: "VI - Muy oscura" },
          ],
        },
        { key: "treatment_area", label: "Area a tratar", type: "text", placeholder: "Ej: Axilas, bikini, piernas completas..." },
        { key: "previous_hair_removal", label: "Metodo de depilacion previo", type: "text", placeholder: "Ej: Rasurado, cera, crema..." },
        { key: "takes_medication", label: "Toma medicamentos fotosensibles", type: "boolean" },
        { key: "medication_details", label: "Cuales", type: "text", conditionalOn: "takes_medication" },
        { key: "recent_sun_exposure", label: "Exposicion solar reciente", type: "boolean" },
        { key: "pregnancy_lactation", label: "Embarazo o lactancia", type: "boolean" },
      ],
    },
    {
      title: "Recomendaciones y Consentimiento",
      icon: "ClipboardList",
      fields: [
        { key: "pre_treatment_notes", label: "Recomendaciones pre-tratamiento", type: "textarea", placeholder: "Indicaciones previas al tratamiento..." },
        { key: "post_treatment_notes", label: "Recomendaciones post-tratamiento", type: "textarea", placeholder: "Cuidados posteriores..." },
        { key: "informed_consent", label: "Consentimiento informado firmado", type: "boolean" },
      ],
    },
  ],
};

// ─── POST OPERATORIO ──────────────────────────────────
const POST_OPERATORIO: FormTypeDef = {
  type: "post_operatorio",
  label: "Post Operatorio",
  icon: "HeartPulse",
  color: "red",
  description: "Evaluacion y seguimiento post-quirurgico",
  hasProductRecommendations: true,
  sections: [
    {
      title: "Datos de la Cirugia",
      icon: "HeartPulse",
      fields: [
        { key: "surgery_type", label: "Cirugia realizada", type: "text", placeholder: "Ej: Liposuccion, abdominoplastia..." },
        { key: "surgery_date", label: "Fecha de la cirugia", type: "text", placeholder: "DD/MM/AAAA" },
        { key: "surgeon_name", label: "Medico/Cirujano", type: "text" },
        { key: "treated_areas", label: "Areas tratadas", type: "textarea", placeholder: "Especifique las areas..." },
      ],
    },
    {
      title: "Evaluacion Post-Quirurgica",
      icon: "ClipboardList",
      fields: [
        {
          key: "inflammation_grade", label: "Grado de inflamacion", type: "radio",
          options: [
            { value: "mild", label: "Leve" },
            { value: "moderate", label: "Moderado" },
            { value: "severe", label: "Severo" },
          ],
        },
        {
          key: "fibrosis_grade", label: "Grado de fibrosis", type: "radio",
          options: [
            { value: "none", label: "Sin fibrosis" },
            { value: "mild", label: "Leve" },
            { value: "moderate", label: "Moderado" },
            { value: "severe", label: "Severo" },
          ],
        },
        { key: "has_seroma", label: "Presencia de seroma", type: "boolean" },
        { key: "has_hematoma", label: "Presencia de hematoma", type: "boolean" },
        { key: "skin_sensitivity", label: "Alteracion de sensibilidad en la piel", type: "boolean" },
        { key: "uses_compression_garment", label: "Usa faja de compresion", type: "boolean" },
      ],
    },
    {
      title: "Historial de Sesiones",
      icon: "ClipboardList",
      fields: [
        { key: "previous_sessions", label: "Numero de sesiones previas", type: "number", placeholder: "0" },
        { key: "technology_used", label: "Tecnologia/tecnicas utilizadas", type: "textarea", placeholder: "Ej: Radiofrecuencia, drenaje linfatico, ultrasonido..." },
        { key: "observations", label: "Observaciones de la sesion", type: "textarea" },
      ],
    },
  ],
};

// ─── CICATRICES ───────────────────────────────────────
const CICATRICES: FormTypeDef = {
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

// ─── PIGMENTACION CORPORAL ────────────────────────────
const PIGMENTACION: FormTypeDef = {
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

// ─── CORPORAL ─────────────────────────────────────────
const CORPORAL: FormTypeDef = {
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

// ─── MASAJE ───────────────────────────────────────────
const MASAJE: FormTypeDef = {
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

// ─── EXPORTS ──────────────────────────────────────────
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
