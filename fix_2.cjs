const fs = require('fs');
let main = fs.readFileSync('src/main.tsx', 'utf8');
main = "import React from 'react';\n" + main;
fs.writeFileSync('src/main.tsx', main);

let tl = fs.readFileSync('src/components/ClinicalTimelineModule.tsx', 'utf8');
tl = "import React from 'react';\n" + tl;
fs.writeFileSync('src/components/ClinicalTimelineModule.tsx', tl);

let addpet = fs.readFileSync('src/components/AddPetDialog.tsx', 'utf8');
addpet = addpet.replace('err as z.ZodError<any>', 'err as z.ZodError');
fs.writeFileSync('src/components/AddPetDialog.tsx', addpet);
