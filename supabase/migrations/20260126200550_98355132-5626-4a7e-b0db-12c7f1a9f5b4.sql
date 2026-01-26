-- Create enums for facial evaluations
CREATE TYPE public.cleaning_frequency_type AS ENUM ('once', 'twice', 'occasional');
CREATE TYPE public.skin_type AS ENUM ('normal', 'dry', 'combination', 'oily', 'sensitive', 'acneic');

-- Create facial_evaluations table
CREATE TABLE public.facial_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Medical data
  has_skin_disease BOOLEAN NOT NULL DEFAULT false,
  skin_disease_details TEXT,
  has_allergies BOOLEAN NOT NULL DEFAULT false,
  allergy_details TEXT,
  takes_medication BOOLEAN NOT NULL DEFAULT false,
  medication_details TEXT,
  recent_treatments BOOLEAN NOT NULL DEFAULT false,
  treatment_details TEXT,
  uses_sunscreen BOOLEAN NOT NULL DEFAULT false,
  smokes_alcohol BOOLEAN NOT NULL DEFAULT false,
  pregnancy_lactation BOOLEAN NOT NULL DEFAULT false,
  
  -- Current routine
  cleaning_frequency cleaning_frequency_type NOT NULL DEFAULT 'once',
  cleanser_brand TEXT,
  serum_brand TEXT,
  cream_brand TEXT,
  sunscreen_brand TEXT,
  uses_makeup BOOLEAN NOT NULL DEFAULT false,
  removes_makeup_properly BOOLEAN NOT NULL DEFAULT false,
  uses_exfoliants BOOLEAN NOT NULL DEFAULT false,
  
  -- Professional evaluation
  skin_type skin_type NOT NULL,
  skin_analysis TEXT,
  treatment_performed TEXT
);

-- Create evaluation_product_recommendations table
CREATE TABLE public.evaluation_product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.facial_evaluations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.facial_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_product_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for facial_evaluations
CREATE POLICY "Staff can view facial_evaluations"
  ON public.facial_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create facial_evaluations"
  ON public.facial_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update facial_evaluations"
  ON public.facial_evaluations FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can delete facial_evaluations"
  ON public.facial_evaluations FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- RLS policies for evaluation_product_recommendations
CREATE POLICY "Staff can view evaluation_product_recommendations"
  ON public.evaluation_product_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create evaluation_product_recommendations"
  ON public.evaluation_product_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update evaluation_product_recommendations"
  ON public.evaluation_product_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can delete evaluation_product_recommendations"
  ON public.evaluation_product_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at on facial_evaluations
CREATE TRIGGER update_facial_evaluations_updated_at
  BEFORE UPDATE ON public.facial_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();