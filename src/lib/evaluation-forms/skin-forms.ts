import type { FormTypeDef } from "./types";

export const FACIAL: FormTypeDef = {
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

export const CAPILAR: FormTypeDef = {
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

export const DEPILACION_LASER: FormTypeDef = {
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

export const POST_OPERATORIO: FormTypeDef = {
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
