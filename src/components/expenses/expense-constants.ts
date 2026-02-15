export const CATEGORIES: Record<string, { label: string; color: string }> = {
  rent: { label: "Alquiler", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  utilities: { label: "Servicios", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  supplies: { label: "Insumos", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  payroll: { label: "Nomina", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  marketing: { label: "Marketing", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  other: { label: "Otro", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

export const PIE_COLORS: Record<string, string> = {
  rent: "hsl(221, 83%, 53%)",
  utilities: "hsl(38, 92%, 50%)",
  supplies: "hsl(142, 71%, 45%)",
  payroll: "hsl(262, 83%, 58%)",
  marketing: "hsl(330, 81%, 60%)",
  other: "hsl(215, 16%, 47%)",
};
