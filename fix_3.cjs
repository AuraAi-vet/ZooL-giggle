const fs = require('fs');

function replaceFileContent(file, regex, replacement) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
}

replaceFileContent('src/components/AddPetDialog.tsx', /(err as z\.ZodError)\.errors/g, '(err as any).errors');
replaceFileContent('src/components/ClinicalTimelineModule.tsx', /map\(\(event, index\) =>/g, 'map((event) =>');
replaceFileContent('src/components/ExportToDocsButton.tsx', /FileText, /g, '');
replaceFileContent('src/components/QRScanner.tsx', /const \[isActive, setIsActive\]/g, 'const [isActive]');
replaceFileContent('src/services/dbService.ts', /, Appointment/g, '');
replaceFileContent('src/services/dbService.ts', /getClinicOperationsData = async \(clinicId: string\)/g, 'getClinicOperationsData = async (_clinicId: string)');
replaceFileContent('src/views/AdminDashboardView.tsx', /, Settings/g, '');
replaceFileContent('src/views/ClinicalChartView.tsx', /useRef, /g, '');
replaceFileContent('src/views/ClinicianDashboardView.tsx', /FileText, /g, '');

let clin = fs.readFileSync('src/views/ClinicianDashboardView.tsx', 'utf8');
clin = clin.replace(/import \{.*?\} from '\.\.\/services\/dbService';\n/, '');
clin = clin.replace(/p =>/g, '() =>');
fs.writeFileSync('src/views/ClinicianDashboardView.tsx', clin);

replaceFileContent('src/views/LoginView.tsx', /Stethoscope, /g, '');
