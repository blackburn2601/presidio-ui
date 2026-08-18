export interface Sample {
  id: string
  label: string
  language: string
  text: string
}

export const SAMPLES: Sample[] = [
  {
    id: 'en-support',
    label: 'Support-Ticket',
    language: 'en',
    text: `Hi, my name is David Johnson and I live at 742 Evergreen Terrace Apt 3B,
Springfield IL 62704.
I work as a software engineer at Contoso Ltd. since March 2019.
You can reach me at david.johnson@contoso.com or on +1 (415) 555-0134.

My credit card number is 4095-2609-9393-4932 and my crypto wallet id is
16Yeky6GMjeNkAiNcBY7ZhrLoMSgg1BoyZ.

On September 18 I visited microsoft.com and sent an email to test@presidio.site,
from the IP 192.168.0.1.

My passport: 191280342 and my phone number: (212) 555-1234.

This is a valid International Bank Account Number: IL150120690000003111111.
Can you please check the status on bank account 954567876544?

Kate's social security number is 078-05-1126. Her driver license? It is 1234567A.`,
  },
  {
    id: 'en-medical',
    label: 'Arztbrief',
    language: 'en',
    text: `Patient: Maria Sanchez, 47 years old, admitted on 12 January 2024.
Referred by Dr. Alan Reeves (medical license BB1388568) from Mercy General Hospital,
1600 Washington Street, Boston MA 02118. Contact the family at maria.sanchez@example.org or 617-555-0198.
Insurance member id 8827-4413-0921. Follow-up scheduled for 3 March 2024.`,
  },
  {
    id: 'de-vertrag',
    label: 'Vertragsauszug (DE)',
    language: 'de',
    text: `Sehr geehrte Frau Schneider,

hiermit bestätigen wir den Vertrag mit Anna Schneider, wohnhaft in der
Hauptstraße 14, 80331 München. Die Kundennummer lautet 4711-2024.

Sie erreichen uns unter kundenservice@musterfirma.de oder telefonisch
unter +49 89 123456. Die Zahlung erfolgt per Lastschrift von der
IBAN DE89370400440532013000 zum 15. Februar 2024.

Ihre Steuer-ID: 12345678995. Das Fahrzeug mit dem Kennzeichen M-AB 1234
wurde am 3. März 2023 von der Siemens AG in Berlin übernommen.

Mit freundlichen Grüßen
Thomas Weber, Musterfirma GmbH`,
  },
  {
    id: 'de-bewerbung',
    label: 'Bewerbung (DE)',
    language: 'de',
    text: `Bewerbung als Softwareentwickler

Mein Name ist Julia Hoffmann, geboren am 7. Juli 1991 in Hamburg.
Aktuell arbeite ich bei der Deutschen Bank AG in Frankfurt am Main.

Kontakt: julia.hoffmann@web.de, Mobil 0170 1234567.
Meine Website: https://julia-hoffmann.de

Ich freue mich auf Ihre Rückmeldung.`,
  },
]
