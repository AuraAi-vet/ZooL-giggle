const url = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0395374194/databases/ai-studio-59f0e8c9-f8aa-4dac-b738-50fe963213c4/documents/users/test';
fetch(url).then(res => res.json()).then(console.log).catch(console.error);
