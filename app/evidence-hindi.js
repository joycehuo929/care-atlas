import {serviceHindi} from "./service-hindi.js";

// Match whole recorded phrases. A new qualifier, negative, or unfamiliar term
// leaves the entire excerpt in its original language.
const categories = new Map([
  ["equipment", "उपकरण"],
  ["procedure/capability", "प्रक्रिया/क्षमता"],
  ["procedure", "प्रक्रिया"],
  ["capability", "क्षमता"],
  ["description", "विवरण"],
  ["specialty", "विशेषता"],
  ["staff", "कर्मचारी"],
  ["department", "विभाग"],
]);

const phrases = new Map([
  ["Performs liver fat quantification using MRI with dual-echo (dual-phase) sequences",
    "ड्युअल-इको (ड्युअल-फेज़) सीक्वेंस वाली MRI से लिवर में वसा की मात्रा मापी जाती है।"],
  ["Assesses hepatic steatosis using MRI with dual-phase liver imaging",
    "ड्युअल-फेज़ लिवर इमेजिंग वाली MRI से लिवर में वसा के जमाव का आकलन किया जाता है।"],
  ["MRI scanner capable of liver fat quantification with dual-echo sequences",
    "MRI स्कैनर ड्युअल-इको सीक्वेंस से लिवर में वसा की मात्रा माप सकता है।"],
  ["MRI system with dual-phase liver imaging capability for hepatic fat quantification",
    "लिवर में वसा की मात्रा मापने के लिए ड्युअल-फेज़ लिवर इमेजिंग की क्षमता वाली MRI प्रणाली।"],
  ["Centre of Excellence in Cardiology, Neurology, Gastroenterology, Nephrology, Hematology, and Orthopedics",
    "हृदय रोग, तंत्रिका रोग, पाचन तंत्र रोग, गुर्दा रोग, रक्त रोग और अस्थि रोग का उत्कृष्टता केंद्र।"],
  ["Center of Excellence in Cardiology", "हृदय रोग का उत्कृष्टता केंद्र।"],
  ["Centre of Excellence in Cardiology", "हृदय रोग का उत्कृष्टता केंद्र।"],
  ["MRI", "एमआरआई"],
  ["MRI scan", "एमआरआई स्कैन"],
  ["MRI scanner", "एमआरआई स्कैनर"],
  ["Magnetic resonance imaging", "चुंबकीय अनुनाद इमेजिंग"],
  ["CT scan", "सीटी स्कैन"],
  ["CT scanner", "सीटी स्कैनर"],
  ["X-ray", "एक्स-रे"],
  ["Ultrasound", "अल्ट्रासाउंड"],
  ["Dialysis", "डायलिसिस"],
  ["Dialysis machine", "डायलिसिस मशीन"],
  ["Dialysis machines", "डायलिसिस की मशीनें"],
  ["Dialysis unit", "डायलिसिस इकाई"],
  ["Hemodialysis", "हीमोडायलिसिस"],
  ["Haemodialysis", "हीमोडायलिसिस"],
  ["Peritoneal dialysis", "पेरिटोनियल डायलिसिस"],
  ["Cardiology", "हृदय रोग चिकित्सा"],
  ["Echocardiography", "इकोकार्डियोग्राफी"],
  ["Electrocardiogram", "इलेक्ट्रोकार्डियोग्राम"],
  ["Neonatal intensive care unit", "नवजात शिशु गहन देखभाल इकाई"],
  ["Intensive care unit", "गहन देखभाल इकाई"],
  ["MRI machine", "एमआरआई मशीन"],
  ["3 Tesla MRI scanner", "3 टेस्ला का एमआरआई स्कैनर"],
  ["1.5 Tesla MRI scanner", "1.5 टेस्ला का एमआरआई स्कैनर"],
  ["1.5 Tesla MRI", "1.5 टेस्ला एमआरआई"],
  ["3 Tesla MRI", "3 टेस्ला एमआरआई"],
  ["MRI facility", "एमआरआई की सुविधा"],
  ["MRI scanners", "एमआरआई स्कैनर (एक से अधिक)"],
  ["MRI system", "एमआरआई प्रणाली"],
  ["MRI imaging capability", "एमआरआई से इमेजिंग की क्षमता"],
  ["MRI scanner on-site", "परिसर में एमआरआई स्कैनर"],
  ["MRI imaging equipment", "एमआरआई इमेजिंग उपकरण"],
  ["Magnetic Resonance Imaging (MRI) scanner", "चुंबकीय अनुनाद इमेजिंग (एमआरआई) स्कैनर"],
  ["3T MRI scanner", "3 टेस्ला का एमआरआई स्कैनर"],
  ["1.5 Tesla MRI machine", "1.5 टेस्ला की एमआरआई मशीन"],
  ["On-site MRI scanner", "परिसर में एमआरआई स्कैनर"],
  ["Magnetic Resonance Imaging (MRI) system", "चुंबकीय अनुनाद इमेजिंग (एमआरआई) प्रणाली"],
  ["MRI 1.5 Tesla", "1.5 टेस्ला एमआरआई"],
  ["Open MRI scanner", "खुला एमआरआई स्कैनर"],
  ["MRI equipment", "एमआरआई उपकरण"],
  ["MRI Scan facility", "एमआरआई स्कैन की सुविधा"],
  ["3T MRI", "3 टेस्ला एमआरआई"],
  ["Has a 3 Tesla MRI scanner", "संस्थान में 3 टेस्ला का एमआरआई स्कैनर है।"],
  ["1.5 Tesla MRI system", "1.5 टेस्ला की एमआरआई प्रणाली"],
  ["MRI facility available", "एमआरआई की सुविधा उपलब्ध है।"],
  ["MRI imaging system", "एमआरआई इमेजिंग प्रणाली"],
  ["Cardiac MRI scanner", "हृदय की एमआरआई का स्कैनर"],
  ["Siemens 1.5 Tesla MRI scanner", "Siemens का 1.5 टेस्ला एमआरआई स्कैनर"],
  ["Skyra 3T MRI", "Skyra की 3 टेस्ला एमआरआई"],
  ["Cardiac MRI equipment", "हृदय की एमआरआई के उपकरण"],
  ["MRI machines", "एमआरआई मशीनें"],
  ["3-Tesla MRI scanner", "3 टेस्ला का एमआरआई स्कैनर"],
  ["1.5T MRI scanner", "1.5 टेस्ला का एमआरआई स्कैनर"],
  ["3.0 Tesla MRI", "3.0 टेस्ला एमआरआई"],
  ["MRI available", "एमआरआई उपलब्ध है।"],
  ["Siemens MRI scanner", "Siemens का एमआरआई स्कैनर"],
  ["MRI scanner on site", "परिसर में एमआरआई स्कैनर"],
  ["Cardiac MRI", "हृदय की एमआरआई"],
  ["MRI imaging facility", "एमआरआई इमेजिंग की सुविधा"],
  ["MRI scanner for diagnostic imaging", "नैदानिक इमेजिंग के लिए एमआरआई स्कैनर"],
  ["MRI imaging services", "एमआरआई इमेजिंग सेवाएँ"],
  ["Tesla MRI", "टेस्ला एमआरआई"],
  ["Has a 1.5 Tesla MRI scanner", "संस्थान में 1.5 टेस्ला का एमआरआई स्कैनर है।"],
  ["3.0 Tesla MRI system", "3.0 टेस्ला की एमआरआई प्रणाली"],
  ["3T MRI system", "3 टेस्ला की एमआरआई प्रणाली"],
  ["MRI and CT scanners", "एमआरआई और सीटी स्कैनर"],
  ["3-Tesla MRI", "3 टेस्ला एमआरआई"],
  ["3.0 Tesla MRI scanner", "3.0 टेस्ला का एमआरआई स्कैनर"],
  ["Siemens 1.5 Tesla MRI scanners", "Siemens के 1.5 टेस्ला एमआरआई स्कैनर (एक से अधिक)"],
  ["In-house MRI scanner", "संस्थान के भीतर एमआरआई स्कैनर"],
  ["MRI scanner (Siemens)", "एमआरआई स्कैनर (Siemens)"],
  ["MRI scanner 1.5 Tesla", "1.5 टेस्ला का एमआरआई स्कैनर"],
  ["Tesla MRI scanner", "टेस्ला एमआरआई स्कैनर"],
  ["MRI scanner available", "एमआरआई स्कैनर उपलब्ध है।"],
  ["MRI 3 Tesla", "3 टेस्ला एमआरआई"],
  ["MRI capability", "एमआरआई की क्षमता"],
  ["MRI (Magnetic Resonance Imaging)", "एमआरआई (चुंबकीय अनुनाद इमेजिंग)"],
  ["Imaging equipment including X-ray, MRI, and CT scanners", "एक्स-रे, एमआरआई और सीटी स्कैनर सहित इमेजिंग उपकरण"],
  ["MRI unit", "एमआरआई इकाई"],
  ["Performs MRI scans", "एमआरआई स्कैन किए जाते हैं।"],
  ["MRI scanning", "एमआरआई स्कैनिंग"],
  ["MRI imaging", "एमआरआई इमेजिंग"],
  ["MRI services", "एमआरआई सेवाएँ"],
  ["Provides Magnetic Resonance Imaging (MRI) services", "चुंबकीय अनुनाद इमेजिंग (MRI) की सेवाएँ दी जाती हैं।"],
  ["Provides MRI imaging services", "एमआरआई इमेजिंग सेवाएँ दी जाती हैं।"],
  ["MRI scans", "एमआरआई स्कैन"],
  ["Provides MRI imaging", "एमआरआई इमेजिंग की सुविधा दी जाती है।"],
  ["Performs MRI", "एमआरआई की जाती है।"],
  ["Performs Magnetic Resonance Imaging (MRI) scans", "चुंबकीय अनुनाद इमेजिंग (MRI) स्कैन किए जाते हैं।"],
  ["Offers MRI scanning", "एमआरआई स्कैनिंग की सुविधा दी जाती है।"],
  ["Performs MRI imaging", "एमआरआई इमेजिंग की जाती है।"],
  ["Offers MRI imaging", "एमआरआई इमेजिंग की सुविधा दी जाती है।"],
  ["MRI Scan Left Knee 3T", "बाएँ घुटने का 3 टेस्ला एमआरआई स्कैन"],
  ["Open MRI Scan Left Shoulder", "बाएँ कंधे का ओपन एमआरआई स्कैन"],
  ["Magnetic resonance imaging (MRI)", "चुंबकीय अनुनाद इमेजिंग (MRI)"],
  ["Provides MRI services", "एमआरआई सेवाएँ दी जाती हैं।"],
  ["Offers MRI imaging services", "एमआरआई इमेजिंग सेवाएँ उपलब्ध कराई जाती हैं।"],
  ["MRI services available", "एमआरआई सेवाएँ उपलब्ध हैं।"],
  ["MRI diagnostic capability", "एमआरआई से निदान की क्षमता"],
  ["Performs MRI scanning", "एमआरआई स्कैनिंग की जाती है।"],
  ["MRI and CT imaging services", "एमआरआई और सीटी इमेजिंग सेवाएँ"],
  ["MRI scan of both lower limbs with contrast", "दोनों पैरों का कॉन्ट्रास्ट सहित एमआरआई स्कैन"],
  ["Provides CT and MRI imaging services", "सीटी और एमआरआई इमेजिंग सेवाएँ दी जाती हैं।"],
  ["Open MRI Scanning Centres", "ओपन एमआरआई स्कैनिंग केंद्र"],
  ["Offers MRI Scan", "एमआरआई स्कैन की सुविधा दी जाती है।"],
  ["Offers Magnetic Resonance Imaging (MRI) services", "चुंबकीय अनुनाद इमेजिंग (MRI) की सेवाएँ दी जाती हैं।"],
  ["Offers MRI scans", "एमआरआई स्कैन की सुविधा दी जाती है।"],
  ["MRI scanning is available", "एमआरआई स्कैनिंग उपलब्ध है।"],
  ["Performs magnetic resonance imaging using a 3 Tesla MRI system", "3 टेस्ला की MRI प्रणाली से चुंबकीय अनुनाद इमेजिंग की जाती है।"],
  ["Offers Magnetic Resonance Imaging (MRI) scans", "चुंबकीय अनुनाद इमेजिंग (MRI) स्कैन की सुविधा दी जाती है।"],
  ["Offers MRI and CT imaging services", "एमआरआई और सीटी इमेजिंग सेवाएँ दी जाती हैं।"],
  ["Offers MRI", "एमआरआई की सुविधा दी जाती है।"],
  ["Performs 1.5 Tesla MRI scans", "1.5 टेस्ला के एमआरआई स्कैन किए जाते हैं।"],
  ["MRI Scan available", "एमआरआई स्कैन उपलब्ध है।"],
  ["Spine MRI", "रीढ़ की एमआरआई"],
  ["MRI imaging for diagnostic purposes", "निदान के लिए एमआरआई इमेजिंग"],
  ["Provides magnetic resonance imaging (MRI) imaging", "चुंबकीय अनुनाद इमेजिंग (MRI) की सुविधा दी जाती है।"],
  ["Open MRI scan of the left shoulder", "बाएँ कंधे का ओपन एमआरआई स्कैन"],
  ["Provides MRI scanning services", "एमआरआई स्कैनिंग सेवाएँ दी जाती हैं।"],
  ["Shoulder MRI Scan", "कंधे का एमआरआई स्कैन"],
  ["MRI Scan Both Lower Limbs with Contrast", "दोनों पैरों का कॉन्ट्रास्ट सहित एमआरआई स्कैन"],
  ["Provides MRI scanning", "एमआरआई स्कैनिंग की सुविधा दी जाती है।"],
  ["MRI - Magnetic Resonance Imaging", "MRI — चुंबकीय अनुनाद इमेजिंग"],
  ["Offers MRI (Magnetic Resonance Imaging)", "MRI (चुंबकीय अनुनाद इमेजिंग) की सुविधा दी जाती है।"],
  ["MRI scans are performed", "एमआरआई स्कैन किए जाते हैं।"],
  ["Magnetic Resonance Imaging (MRI) scanning", "चुंबकीय अनुनाद इमेजिंग (MRI) स्कैनिंग"],
  ["MRI diagnostic imaging", "निदान के लिए एमआरआई इमेजिंग"],
  ["24 Hours MRI Scanning Centres", "24 घंटे की सेवा वाले एमआरआई स्कैनिंग केंद्र"],
  ["Magnetic resonance imaging (MRI) services", "चुंबकीय अनुनाद इमेजिंग (MRI) सेवाएँ"],
  ["Performs magnetic resonance imaging (MRI)", "चुंबकीय अनुनाद इमेजिंग (MRI) की जाती है।"],
  ["MRI service", "एमआरआई सेवा"],
  ["Magnetic Resonance Cholangiopancreatography (MRCP)", "मैग्नेटिक रेज़ोनेंस कोलैंजियोपैंक्रियाटोग्राफी (MRCP)"],
  ["MRI Brain scan", "मस्तिष्क का एमआरआई स्कैन"],
  ["MRI services offered using 3 Tesla and 1.5 Tesla MRI systems", "3 टेस्ला और 1.5 टेस्ला की एमआरआई प्रणालियों से एमआरआई सेवाएँ दी जाती हैं।"],
  ["Offers Magnetic Resonance Imaging (MRI) as a diagnostic procedure", "नैदानिक जाँच के तौर पर चुंबकीय अनुनाद इमेजिंग (MRI) की सुविधा दी जाती है।"],
  ["MRI imaging services including 1.5 T MRI and Open MRI", "एमआरआई इमेजिंग सेवाएँ, जिनमें 1.5 टेस्ला एमआरआई और ओपन एमआरआई शामिल हैं।"],
  ["Performs orthopedic MRI using a 3 Tesla MRI scanner", "3 टेस्ला के एमआरआई स्कैनर से हड्डियों और जोड़ों की एमआरआई की जाती है।"],
  ["Offers 3 Tesla MRI Services", "3 टेस्ला एमआरआई की सेवाएँ दी जाती हैं।"],
  ["Specialized orthopedic MRI capability using a 3 Tesla MRI scanner", "3 टेस्ला के एमआरआई स्कैनर से हड्डियों और जोड़ों की विशेष एमआरआई करने की क्षमता।"],
  ["MRI imaging services including 3 Tesla MR Imaging", "एमआरआई इमेजिंग सेवाएँ, जिनमें 3 टेस्ला एमआर इमेजिंग शामिल है।"],
  ["MRI scans are performed at GVK Health Hub", "GVK Health Hub में एमआरआई स्कैन किए जाते हैं।"],
  ["Provides dialysis treatment", "डायलिसिस उपचार दिया जाता है।"],
  ["Dialysis services", "डायलिसिस सेवाएँ"],
  ["Provides dialysis services", "डायलिसिस सेवाएँ दी जाती हैं।"],
  ["Dialysis treatment", "डायलिसिस उपचार"],
  ["Advanced Kidney Dialysis", "गुर्दों का उन्नत डायलिसिस"],
  ["Kidney dialysis", "गुर्दों का डायलिसिस"],
  ["Provides hemodialysis treatment", "हीमोडायलिसिस उपचार दिया जाता है।"],
  ["Provides haemodialysis treatment", "हीमोडायलिसिस उपचार दिया जाता है।"],
  ["Offers dialysis services", "डायलिसिस सेवाएँ उपलब्ध कराई जाती हैं।"],
  ["Offers dialysis treatment", "डायलिसिस उपचार उपलब्ध कराया जाता है।"],
  ["Dialysis treatment is provided", "डायलिसिस उपचार दिया जाता है।"],
  ["Dialysis facility", "डायलिसिस की सुविधा"],
  ["Provides dialysis", "डायलिसिस की सुविधा दी जाती है।"],
  ["Continuous Renal Replacement Therapy (CRRT)", "निरंतर गुर्दा प्रतिस्थापन चिकित्सा (CRRT)"],
  ["Dialysis procedures", "डायलिसिस की प्रक्रियाएँ"],
  ["Dialysis (hemodialysis)", "डायलिसिस (हीमोडायलिसिस)"],
  ["Dialysis treatment is offered", "डायलिसिस उपचार उपलब्ध कराया जाता है।"],
  ["CRRT (Continuous Renal Replacement Therapy)", "CRRT (निरंतर गुर्दा प्रतिस्थापन चिकित्सा)"],
  ["Dialysis centre", "डायलिसिस केंद्र"],
  ["Dialysis center", "डायलिसिस केंद्र"],
  ["Provides kidney dialysis", "गुर्दों के डायलिसिस की सुविधा दी जाती है।"],
  ["Hemodialysis treatment", "हीमोडायलिसिस उपचार"],
  ["Dialysis facilities", "डायलिसिस की सुविधाएँ"],
  ["Continuous ambulatory peritoneal dialysis (CAPD)", "निरंतर एम्बुलेटरी पेरिटोनियल डायलिसिस (CAPD)"],
  ["Provides hemodialysis services", "हीमोडायलिसिस सेवाएँ दी जाती हैं।"],
  ["Dialysis is provided", "डायलिसिस की सुविधा दी जाती है।"],
  ["Offers dialysis", "डायलिसिस की सुविधा दी जाती है।"],
  ["Nephrology and dialysis services", "गुर्दा रोग चिकित्सा और डायलिसिस सेवाएँ"],
  ["Provides hemodialysis", "हीमोडायलिसिस की सुविधा दी जाती है।"],
  ["Dialysis service", "डायलिसिस सेवा"],
  ["Haemodialysis - Peritoneal Dialysis", "हीमोडायलिसिस — पेरिटोनियल डायलिसिस"],
  ["Dialysis equipment", "डायलिसिस उपकरण"],
  ["Dialysis units", "डायलिसिस इकाइयाँ"],
  ["On-site dialysis facility", "परिसर में डायलिसिस की सुविधा"],
  ["Dialysis unit on-site", "परिसर में डायलिसिस इकाई"],
  ["On-site dialysis unit", "परिसर में डायलिसिस इकाई"],
  ["Hemodialysis machines", "हीमोडायलिसिस की मशीनें"],
  ["Hemodialysis equipment", "हीमोडायलिसिस उपकरण"],
  ["Haemodialysis unit", "हीमोडायलिसिस इकाई"],
  ["On-site dialysis equipment", "परिसर में डायलिसिस उपकरण"],
  ["Hemodialysis unit", "हीमोडायलिसिस इकाई"],
  ["Child-specific dialysis machines", "विशेष रूप से बच्चों के लिए डायलिसिस मशीनें"],
  ["Dialysis chair", "डायलिसिस कुर्सी"],
  ["Dialysis facility on site", "परिसर में डायलिसिस की सुविधा"],
  ["Peritoneal dialysis equipment", "पेरिटोनियल डायलिसिस उपकरण"],
  ["On-site dialysis center", "परिसर में डायलिसिस केंद्र"],
  ["CRRT (Continuous Renal Replacement Therapy) equipment", "CRRT (निरंतर गुर्दा प्रतिस्थापन चिकित्सा) के उपकरण"],
  ["Advanced dialysis unit", "उन्नत डायलिसिस इकाई"],
  ["Ultra-modern dialysis unit", "अत्याधुनिक डायलिसिस इकाई"],
  ["Dialysis centre offering haemodialysis and peritoneal dialysis", "हीमोडायलिसिस और पेरिटोनियल डायलिसिस उपलब्ध कराने वाला डायलिसिस केंद्र"],
].map(([source, hindi]) => [source.toLowerCase(), hindi]));

function sourceText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";
}

// Only reuse a service translation when its complete English name is
// unambiguous across the live catalog. An unknown record never seeds a match.
export function buildEvidenceGlossary(services) {
  const glossary = new Map();
  for (const service of services) {
    const name = sourceText(service.label).toLowerCase();
    const hindi = serviceHindi[service.id]?.label;
    if (!name || !hindi) continue;
    if (!glossary.has(name)) glossary.set(name, hindi);
    else if (glossary.get(name) !== hindi) glossary.set(name, null);
  }
  return glossary;
}

function phraseHindi(value, glossary) {
  const text = value.replace(/\.$/u, "");
  const key = text.toLowerCase();
  const phrase = phrases.get(key) || glossary?.get(key);
  if (phrase) return phrase;
  const equipment = /^(\d+(?:\.\d+)?) Tesla MRI with (\d+) software applications$/iu.exec(text);
  if (equipment) return equipment[1] + " टेस्ला की MRI मशीन, " + equipment[2] + " सॉफ़्टवेयर अनुप्रयोगों के साथ।";
  // Accept a list of names only when every complete item has a catalog
  // translation. A partial match could lose an anatomical site or qualifier.
  const names = key.split(/,\s*(?:and\s+)?|;\s*|\s+(?:and|&)\s+/u);
  if (glossary && names.length > 1) {
    const translated = names.map(name => glossary.get(name.trim()));
    if (translated.every(Boolean)) return translated.join(", ");
  }
  return null;
}

export function hindiExcerpt(source, glossary) {
  const text = sourceText(source);
  const colon = text.indexOf(":");
  if (colon < 0) return phraseHindi(text, glossary);
  const category = categories.get(text.slice(0, colon).trim().toLowerCase());
  const translation = phraseHindi(text.slice(colon + 1).trim(), glossary);
  return category && translation ? category + ": " + translation : null;
}

const grades = new Map([
  ["verified", "सत्यापित"], ["likely", "संभावित"], ["claimed only", "केवल दावा"],
]);

const cautions = new Map([
  ["coordinates disagree with pin code", "निर्देशांक पिन कोड से मेल नहीं खाते"],
  ["location is approximate", "स्थान अनुमानित है"],
  ["specialty list looks inflated", "विशेषताओं की सूची बढ़ा-चढ़ाकर बताई गई लगती है"],
  ["record may merge two different places", "संभव है कि इस रिकॉर्ड में दो अलग-अलग स्थानों की जानकारी मिल गई हो"],
  ["address state conflicts with pin code", "पते में दर्ज राज्य पिन कोड से मेल नहीं खाता"],
  ["a homeopathy/ayurveda/unani facility claiming a modern-medicine service", "होम्योपैथी, आयुर्वेद या यूनानी चिकित्सा का संस्थान आधुनिक चिकित्सा की सेवा देने का दावा करता है"],
  ["doctor/bed numbers look unrealistic", "डॉक्टरों या बिस्तरों की दर्ज संख्या अविश्वसनीय लगती है"],
  ["duplicate name in the same city", "इसी शहर में यह नाम एक से अधिक बार दर्ज है"],
]);

export function hindiCaution(source) {
  const text = sourceText(source).replace(/\.$/u, "");
  const translation = cautions.get(text.toLowerCase());
  if (translation) return translation;
  const other = /^evidence names a similarly-named but different facility \('([^'\n]+)'\), may describe another place$/iu.exec(text);
  return other ? "प्रमाण में मिलते-जुलते नाम वाले एक अलग संस्थान (“" + other[1] + "”) का उल्लेख है। यह विवरण किसी अन्य स्थान का हो सकता है।" : null;
}

export function hindiEvidenceNote(source, glossary) {
  const text = sourceText(source);
  const match = /^(?:(Verified|Likely|Claimed only):\s*)?([^"]*?)(?:\s*Evidence: "([^"]+)"\.?)?(?:\s*Caution:\s*(.+?))?$/iu.exec(text);
  if (!match) return null;
  const [, grade, summary, excerpt, caution] = match;
  const count = /^(\d+) independent kinds? of evidence in this facility['’]s own records\.?$/iu.exec(summary.trim());
  let note;
  if (count) {
    note = "इस संस्थान के अपने रिकॉर्ड में " + count[1] + " तरह के स्वतंत्र प्रमाण मिले हैं।";
  } else if (/^direct evidence found, but not fully confirmed\.?$/iu.test(summary.trim())) {
    note = "प्रत्यक्ष प्रमाण मिले हैं, लेकिन पूरी पुष्टि नहीं हुई है।";
  } else if (/^listed, but no direct evidence found\. Call to confirm before going\.?$/iu.test(summary.trim())) {
    note = "सेवा सूची में दर्ज है, लेकिन कोई प्रत्यक्ष प्रमाण नहीं मिला। जाने से पहले फ़ोन करके पुष्टि करें।";
  } else {
    return null;
  }
  if (excerpt) {
    const quote = hindiExcerpt(excerpt, glossary);
    if (!quote) return null;
    note += " प्रमाण: “" + quote + "”";
  }
  if (caution) {
    const lines = caution.split(";").map(hindiCaution);
    if (!lines.every(Boolean)) return null;
    note += " सावधानी: " + lines.join("। ").replace(/।$/u, "") + "।";
  }
  return grade ? grades.get(grade.toLowerCase()) + ": " + note : note;
}
