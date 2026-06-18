export const ANIMAL_TYPES = [
  'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Fish', 'Reptile', 'Horse', 'Other'
];

export const ANIMAL_BREEDS: Record<string, string[]> = {
  'Dog': [
    'Mixed Breed', 'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
    'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'German Shorthaired Pointer', 'Dachshund',
    'Corgi', 'Australian Shepherd', 'Yorkshire Terrier', 'Boxer', 'Siberian Husky', 'Other'
  ],
  'Cat': [
    'Mixed Breed', 'Domestic Shorthair', 'Domestic Longhair', 'Persian', 'Maine Coon', 'Ragdoll',
    'Siamese', 'Sphynx', 'British Shorthair', 'Abyssinian', 'Scottish Fold', 'Bengal', 'Other'
  ],
  'Bird': [
    'Parakeet', 'Cockatiel', 'Parrot', 'Canary', 'Finch', 'Lovebird', 'Macaw', 'Cockatoo', 'Other'
  ],
  'Rabbit': [
    'Mixed Breed', 'Holland Lop', 'Mini Lop', 'Netherland Dwarf', 'Lionhead', 'Flemish Giant', 'Other'
  ],
  'Hamster': ['Syrian', 'Dwarf', 'Roborovski', 'Chinese', 'Other'],
  'Guinea Pig': ['American', 'Abyssinian', 'Peruvian', 'Silkie', 'Teddy', 'Other'],
  'Fish': ['Betta', 'Goldfish', 'Guppy', 'Tetra', 'Cichlid', 'Other'],
  'Reptile': ['Bearded Dragon', 'Gecko', 'Snake', 'Turtle', 'Tortoise', 'Other'],
  'Horse': ['Quarter Horse', 'Thoroughbred', 'Arabian', 'Appaloosa', 'Paint', 'Draft', 'Other'],
  'Other': ['Unknown/Mixed', 'Other']
};
