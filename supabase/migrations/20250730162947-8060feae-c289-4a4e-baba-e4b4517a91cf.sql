-- Create boards table
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  canvas_data JSONB DEFAULT '{}',
  sticky_notes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Create board members table
CREATE TABLE public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Enable RLS
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view boards they're members of" 
ON public.boards 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_id = boards.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own boards" 
ON public.boards 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Board owners and editors can update boards" 
ON public.boards 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_id = boards.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "Board owners can delete boards" 
ON public.boards 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for board_members
CREATE POLICY "Users can view members of boards they belong to" 
ON public.board_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.board_members bm 
    WHERE bm.board_id = board_members.board_id AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Board owners can manage members" 
ON public.board_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_members.board_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can join boards if invited" 
ON public.board_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for real-time collaboration
ALTER TABLE public.boards REPLICA IDENTITY FULL;
ALTER TABLE public.board_members REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;