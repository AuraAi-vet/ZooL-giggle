import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

export const authorizeGoogleDrive = async (auth: any): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return credential?.accessToken || null;
  } catch (error) {
    console.error("Google Drive authorization failed", error);
    return null;
  }
};

export const backupPetDataToDrive = async (accessToken: string, pet: any, records: any[]) => {
  const content = JSON.stringify({ pet, records }, null, 2);
  const metadata = {
    name: `ZooL_Backup_${pet.name}_${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to backup to Google Drive');
  }

  return response.json();
};

export const exportPetReportToDriveDocs = async (accessToken: string, pet: any, records: any[]) => {
    // Basic text export replacing pdf logic (Drive handles text simply)
    const reportText = `MEDICAL REPORT FOR ${pet.name.toUpperCase()}\nBreed: ${pet.breed}\nAge: ${pet.age} years\n\nRECORDS:\n` + 
       records.map(r => `- ${r.date}: ${r.title} (${r.type})`).join('\n');
    
    // First create a Google Doc
    const metadata = {
        name: `Medical_Report_${pet.name}_${new Date().toISOString().split('T')[0]}`,
        mimeType: 'application/vnd.google-apps.document',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([reportText], { type: 'text/plain' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        body: form,
    });

    if (!response.ok) {
        throw new Error('Failed to create Document in Google Drive');
    }

    return response.json();
}
