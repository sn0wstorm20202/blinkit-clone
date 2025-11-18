-- Insert Categories
INSERT INTO public.categories (name, icon_url) VALUES
('Fruits & Vegetables', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/paan-corner_web.png'),
('Dairy, Bread & Eggs', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Dairy-Bread-Eggs.png'),
('Snacks & Munchies', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Snacks-Munchies.png'),
('Cold Drinks & Juices', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/cold-drinks-&-juices_web.png'),
('Breakfast & Instant Food', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Breakfast-Instant-Food.png'),
('Sweet Tooth', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Mithai.png'),
('Baby Care', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Baby-Care_web.png'),
('Pet Care', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Pet-Care_web.png')
ON CONFLICT DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
  fruits_veg_id UUID;
  dairy_id UUID;
  snacks_id UUID;
  drinks_id UUID;
  breakfast_id UUID;
  sweets_id UUID;
  baby_id UUID;
  pet_id UUID;
BEGIN
  SELECT id INTO fruits_veg_id FROM public.categories WHERE name = 'Fruits & Vegetables';
  SELECT id INTO dairy_id FROM public.categories WHERE name = 'Dairy, Bread & Eggs';
  SELECT id INTO snacks_id FROM public.categories WHERE name = 'Snacks & Munchies';
  SELECT id INTO drinks_id FROM public.categories WHERE name = 'Cold Drinks & Juices';
  SELECT id INTO breakfast_id FROM public.categories WHERE name = 'Breakfast & Instant Food';
  SELECT id INTO sweets_id FROM public.categories WHERE name = 'Sweet Tooth';
  SELECT id INTO baby_id FROM public.categories WHERE name = 'Baby Care';
  SELECT id INTO pet_id FROM public.categories WHERE name = 'Pet Care';

  -- Fruits & Vegetables
  INSERT INTO public.products (name, price, weight, image_url, category_id, is_available, stock_quantity) VALUES
  ('Potato', 25.00, '1 kg', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/56e7d844-8c79-4fc6-a5c2-1e13d0b5b95a.jpg', fruits_veg_id, true, 100),
  ('Onion', 30.00, '1 kg', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/c5e93f8e-e5a9-4c8c-a6da-9db7a52e0695.jpg', fruits_veg_id, true, 150),
  ('Tomato', 35.00, '500 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/8f501ab9-5ee4-44f5-bd5c-a819b4e86eee.jpg', fruits_veg_id, true, 120),
  ('Banana', 40.00, '1 dozen', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/cb0c5b52-6c2f-427c-a9e6-b0ecff4c55b1.jpg', fruits_veg_id, true, 80),
  ('Apple', 150.00, '4 pcs', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/3a57a73f-2d94-4edb-adf8-e5a5df0b0da6.jpg', fruits_veg_id, true, 60),
  ('Carrot', 28.00, '500 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/2c1f7c50-c9c8-46a6-8f63-854b48e88b02.jpg', fruits_veg_id, true, 90),
  
  -- Dairy, Bread & Eggs
  ('Amul Butter', 56.00, '100 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/4db61fdd-e5c3-4c56-96dd-12c8e9b06f12.jpg', dairy_id, true, 200),
  ('Amul Milk', 32.00, '500 ml', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/5c6c4246-cbcd-470e-9cb8-cd2a09a6b2e0.jpg', dairy_id, true, 150),
  ('Bread', 35.00, '400 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/68cb1838-8a6b-4f1a-a55e-b5d6c4e75d03.jpg', dairy_id, true, 100),
  ('Eggs', 75.00, '6 pcs', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/dae19d57-e9ff-4e41-b968-96ae1add70f2.jpg', dairy_id, true, 80),
  ('Paneer', 85.00, '200 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/b3a72f01-8bef-4fc2-b6f9-4e01e45f1e4f.jpg', dairy_id, true, 70),
  ('Curd', 30.00, '400 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/60fbf32c-7f36-4da1-b0b5-67770db4ab94.jpg', dairy_id, true, 90),
  
  -- Snacks & Munchies
  ('Lays Classic', 20.00, '52 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/7cc5b7c3-0a34-4b98-a992-f8a0fe76d0e1.jpg', snacks_id, true, 200),
  ('Kurkure', 20.00, '90 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/9fc1f8e1-a0f8-4851-8c7a-0a0e63e6cf7b.jpg', snacks_id, true, 180),
  ('Haldirams Bhujia', 30.00, '200 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/fba2c18e-f3cf-4c1b-beff-87e6ef96ad4e.jpg', snacks_id, true, 150),
  ('Bingo Mad Angles', 20.00, '72.5 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/e8a1ea46-1e41-48d5-b33f-52e14c7fb72f.jpg', snacks_id, true, 160),
  
  -- Cold Drinks & Juices
  ('Coca Cola', 40.00, '750 ml', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/b59fc09b-6e2e-4c94-977f-a3aa62e0c48e.jpg', drinks_id, true, 200),
  ('Pepsi', 40.00, '750 ml', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/8aa8e2ab-0a2b-45e3-bfa1-0cb26a1a5ee5.jpg', drinks_id, true, 180),
  ('Real Juice', 120.00, '1 L', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/af72e403-9e4d-446e-bfe3-8dcd9d34f49a.jpg', drinks_id, true, 100),
  ('Frooti', 10.00, '160 ml', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/87d0b155-f19a-43c6-87d8-51e45b2e4e99.jpg', drinks_id, true, 250),
  
  -- Breakfast & Instant Food
  ('Maggi', 12.00, '70 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/f5cb37c8-d5d1-4e4d-abfd-9ee1dd5a4a8e.jpg', breakfast_id, true, 300),
  ('Kelloggs Corn Flakes', 180.00, '475 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/d1ef2289-4508-41d3-918a-70ec8f4cefed.jpg', breakfast_id, true, 80),
  ('Saffola Oats', 200.00, '1 kg', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/1a18f42f-8c1e-4646-9c85-5fe2af1b8c11.jpg', breakfast_id, true, 60),
  ('Top Ramen', 12.00, '70 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/ddee4a5f-b1e8-4a46-8e43-73f44b5b71e6.jpg', breakfast_id, true, 250),
  
  -- Sweet Tooth
  ('Cadbury Dairy Milk', 50.00, '55 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/32db6f6f-ba53-4e16-bbd0-b8d7df2e98dc.jpg', sweets_id, true, 200),
  ('Kitkat', 20.00, '27 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/c8e4b4f7-f4b8-4341-abfd-6d5bd8b3a8ac.jpg', sweets_id, true, 220),
  ('5 Star', 10.00, '22 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/c51ee7e7-1c6e-4b40-b3b1-b9ab52ccba02.jpg', sweets_id, true, 250),
  ('Amul Ice Cream', 250.00, '700 ml', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/ee4ec9dc-09eb-4729-8a4d-d23f54f00ff3.jpg', sweets_id, true, 40),
  
  -- Baby Care
  ('Pampers Diapers', 899.00, '72 pcs', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/8ae2b9f8-ad69-4efa-981f-4d42e1b1f46b.jpg', baby_id, true, 30),
  ('Johnson Baby Soap', 65.00, '75 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/ecda7090-6a22-4a41-9c5d-66e8bb36c85b.jpg', baby_id, true, 50),
  ('Cerelac', 245.00, '300 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/6e9e2bfa-a3f9-428f-bbad-c04dafaa9f66.jpg', baby_id, true, 40),
  
  -- Pet Care
  ('Pedigree Dog Food', 280.00, '1.2 kg', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/0af5e28f-14a7-4ae7-a5e3-eb2f01cf3a9f.jpg', pet_id, true, 45),
  ('Whiskas Cat Food', 135.00, '480 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/47c8be11-fe03-4eec-a35d-0d6f471add26.jpg', pet_id, true, 60),
  ('Drools Dog Treats', 149.00, '300 g', 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=480/app/assets/products/sliding_images/jpeg/c8c88cc3-cd8d-4bd5-9e3f-d7c5e59e3e86.jpg', pet_id, true, 70);

END $$;
