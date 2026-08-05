export const WSU_PROGRAMMES: Record<string, Record<string, string[]>> = {
  "Mthatha": {
    "Faculty of Economic & Financial Sciences": [
      "Diploma in Accountancy",
      "Diploma in Financial Information Systems",
      "Diploma in Internal Auditing",
      "Diploma in Internal Auditing (ECP)",
      "Bachelor of Accounting",
      "Bachelor of Accounting Science",
      "Bachelor of Commerce",
      "Bachelor of Commerce in Business Management",
      "Bachelor of Commerce in Economics"
    ],
    "Faculty of Education": [
      "Bachelor of Education in Foundation Phase Teaching",
      "Bachelor of Education in Senior Phase & FET Teaching (Creative Arts History)",
      "Bachelor of Education in Senior Phase & FET Teaching (Creative Arts English)",
      "Bachelor of Education in Senior Phase & FET Teaching (Creative Arts English) - ECP",
      "Bachelor of Education in Senior Phase & FET Teaching (Consumer & Management Science)",
      "Bachelor of Education in Senior Phase & FET Teaching (Economic & Management Science)",
      "Bachelor of Education in Senior Phase & FET Teaching (Humanities)",
      "Bachelor of Education in Senior Phase & FET Teaching (Languages)",
      "Bachelor of Education in Senior Phase & FET Teaching (Maths, Science & Technology)",
      "Bachelor of Education in Senior Phase & FET Teaching (Technical and Vocational Education)"
    ],
    "Faculty of Law, Humanities & Social Sciences": [
      "Bachelor of Arts",
      "Bachelor of Arts (English)",
      "Bachelor of Social Science (Anthropology)",
      "Bachelor of Social Science (Anthropology) - ECP",
      "Bachelor of Social Science (Criminology)",
      "Bachelor of Social Science (Criminology) - ECP",
      "Bachelor of Social Science (Philosophy)",
      "Bachelor of Social Science (Philosophy) - ECP",
      "Bachelor of Social Science (Political Studies)",
      "Bachelor of Social Science (Political Studies) - ECP",
      "Bachelor of Social Science (Population Studies)",
      "Bachelor of Social Science (Population Studies) - ECP",
      "Bachelor of Social Science (Psychology)",
      "Bachelor of Social Science (Psychology) - ECP",
      "Bachelor of Social Science (Sociology)",
      "Bachelor of Social Science (Sociology) - ECP",
      "Bachelor of Laws",
      "Bachelor of Psychology",
      "Bachelor of Social Work"
    ],
    "Faculty of Medicine & Health Sciences": [
      "Bachelor of Medical Sciences",
      "Bachelor of Medicine in Clinical Practice",
      "Bachelor of Nursing",
      "Bachelor of Health Sciences in Medical Orthotics and Prosthetics",
      "Bachelor of Medicine and Bachelor of Surgery"
    ],
    "Faculty of Natural Sciences": [
      "Diploma in Pest Management",
      "Bachelor of Science in Applied Mathematics",
      "Bachelor of Science in Applied Mathematics (ECP)",
      "Bachelor of Science in Applied Statistical Sciences",
      "Bachelor of Science in Applied Statistical Sciences (ECP)",
      "Bachelor of Science in Biological Sciences",
      "Bachelor of Science in Biological Sciences (ECP)",
      "Bachelor of Science in Chemistry",
      "Bachelor of Science in Chemistry (ECP)",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Computer Science (ECP)",
      "Bachelor of Science in Environmental Studies",
      "Bachelor of Science in Environmental Studies (ECP)",
      "Bachelor of Science in Mathematics",
      "Bachelor of Science in Mathematics (ECP)",
      "Bachelor of Science in Pest Management",
      "Bachelor of Science in Pest Management (ECP)",
      "Bachelor of Science in Physics",
      "Bachelor of Science in Physics (ECP)"
    ]
  },
  "Komani": {
    "Faculty of Education": [
      "Bachelor of Education in Foundation Phase Teaching",
      "Bachelor of Education in Senior Phase & FET Teaching (Economic & Management Science)",
      "Bachelor of Education in Senior Phase & FET Teaching (Humanities)",
      "Bachelor of Education in Senior Phase & FET Teaching (Languages)",
      "Bachelor of Education in Senior Phase & FET Teaching (Maths, Science & Technology)"
    ],
    "Faculty of Management & Public Administration Sciences": [
      "Diploma in Human Resources Management",
      "Diploma in Human Resources Management (ECP)",
      "Diploma in Local Government Finance",
      "Diploma in Local Government Finance (ECP)",
      "Diploma in Public Management"
    ]
  },
  "Buffalo City": {
    "Faculty of Engineering, Built Environment & Information Technology": [
      "Diploma in Building Technology",
      "Diploma in Building Technology (ECP)",
      "Diploma in Civil Engineering",
      "Diploma in Civil Engineering (ECP)",
      "Diploma in Electrical Engineering",
      "Diploma in Electrical Engineering (ECP)",
      "Diploma in Mechanical Engineering",
      "Diploma in Mechanical Engineering (ECP)",
      "Diploma in ICT in Applications Development",
      "Diploma in ICT in Applications Development (ECP)",
      "Diploma in ICT in Business Analysis",
      "Diploma in ICT in Business Analysis (ECP)",
      "Diploma in ICT in Communication Networks",
      "Diploma in ICT in Communication Networks (ECP)",
      "Diploma in ICT in Support Services",
      "Diploma in ICT in Support Services (ECP)"
    ],
    "Faculty of Law, Humanities & Social Sciences": [
      "Diploma in Fashion",
      "Diploma in Fine Art"
    ],
    "Faculty of Management & Public Administration Sciences": [
      "Higher Certificate in Versatile Broadcasting",
      "Diploma in Journalism"
    ],
    "Faculty of Natural Sciences": [
      "Diploma in Analytical Chemistry",
      "Diploma in Analytical Chemistry (ECP)",
      "Diploma in Consumer Science in Food and Nutrition",
      "Diploma in Consumer Science in Food and Nutrition (ECP)"
    ]
  },
  "Butterworth": {
    "Faculty of Engineering, Built Environment & Information Technology": [
      "Diploma in Building Technology",
      "Diploma in Building Technology (ECP)",
      "Diploma in Civil Engineering",
      "Diploma in Civil Engineering (ECP)"
    ],
    "Faculty of Management & Public Administration Sciences": [
      "Diploma in Administrative Management",
      "Diploma in Hospitality Management",
      "Diploma in Human Resources Management",
      "Diploma in Human Resources Management (ECP)",
      "Diploma in Local Government Finance",
      "Diploma in Local Government Finance (ECP)",
      "Diploma in Management",
      "Diploma in Management (ECP)",
      "Diploma in Marketing Management",
      "Diploma in Policing",
      "Diploma in Office Management & Technology",
      "Diploma in Office Management & Technology (ECP)",
      "Diploma in Public Management",
      "Diploma in Public Relations Management",
      "Diploma in Public Relations Management (ECP)",
      "Diploma in Small Business Management",
      "Diploma in Sport Management",
      "Diploma in Tourism Management",
      "Bachelor of Administration"
    ]
  }
};

export const CAMPUSES = ["Mthatha", "Komani", "Buffalo City", "Butterworth"];

export const facultiesFor = (campus: string): string[] =>
  campus && WSU_PROGRAMMES[campus] ? Object.keys(WSU_PROGRAMMES[campus]) : [];

export const coursesFor = (campus: string, faculty: string): string[] =>
  campus && faculty ? (WSU_PROGRAMMES[campus]?.[faculty] ?? []) : [];
