import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { HealthRecord, Pet } from '../types';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'
];

export const authorizeGmail = async (auth: any): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return credential?.accessToken || null;
  } catch (error) {
    console.error("Gmail authorization failed", error);
    return null;
  }
};

export const logGmailSendSuccess = (recipient: string, subject: string) => {
  try {
    const rawLogs = localStorage.getItem('zool_gmail_send_history');
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.unshift({
      timestamp: new Date().toISOString(),
      serviceName: "Gmail API",
      recipient,
      subject
    });
    localStorage.setItem('zool_gmail_send_history', JSON.stringify(logs.slice(0, 10)));
  } catch (error) {
    console.error("Failed to log Gmail send history", error);
  }
};

export const sendEmailViaGmail = async (accessToken: string, to: string, subject: string, bodyText: string) => {
    const emailContent = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        bodyText
    ].join('\n');

    const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            raw: encodedEmail
        })
    });

    if (!response.ok) {
        throw new Error('Failed to send email via Gmail');
    }

    logGmailSendSuccess(to, subject);
    return response.json();
};

export const generateClinicalEmailBody = (record: HealthRecord, pet?: Pet): string => {
  const currentTimestamp = new Date().toLocaleString();
  const vitalsText = pet ? `
PATIENT VITALS & SPECS (AUTO-EXTRACTED)
----------------------------------------
• Patient Name: ${pet.name.toUpperCase()}
• Species/Type: ${pet.type || 'N/A'}
• Breed: ${pet.breed || 'N/A'}
• Age: ${pet.age ? `${pet.age} years` : 'N/A'}
• Current Weight: ${pet.weight ? `${pet.weight} kg` : 'N/A'}
` : `
PATIENT INFO
-------------
• Record Date: ${record.date}
`;

  return `
ZooL CLINICAL INTEGRATION SERVICE — MEDICAL SHARE
===================================================
Generated: ${currentTimestamp}

This is a certified electronic health record broadcast from the ZooL Clinical Platform. The attached diagnostic data, treatment details, and vaccine intervals have been authorized for primary care lookup and emergency triage review.

${vitalsText.trim()}

CLINICAL RECORD EXTRACTION
---------------------------
• Event Title: ${record.title}
• Record Category: ${record.type.toUpperCase()}
• Logged Date: ${record.date}
• Government Verification: ${record.verifiedByGov ? `VERIFIED (ID: ${record.govVerifyId})` : 'Self-Reported Log'}
${record.prescription ? `• Prescription Order: ${record.prescription}` : ''}
${record.nextDueDate ? `• Post-Care Next Due: ${record.nextDueDate}` : ''}

CLINICAL DIAGNOSTIC NOTES / ASSESSMENT
---------------------------------------
${record.clinicalNotes || record.description || 'No direct clinical notes are logged for this diagnostic episode.'}

===================================================
CONFIDENTIALITY & DATA SECURITY NOTICE
--------------------------------------
This transmission may contain highly sensitive, legally protected veterinary health information. It is intended solely for licensed medical professionals or verified patient handlers. If you are not the intended recipient, please destroy this transmission immediately.

Composed securely via ZooL Cloud Sync under Google OAuth Consent protocol.
`;
};

