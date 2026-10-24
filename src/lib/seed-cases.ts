import type { CaseBrief } from "./types";
import type { SeedDocument } from "./seed-statutes";

const SCI = "https://main.sci.gov.in/";
const VERIFY = "Verify the citation and paragraph numbers in the official reporter (SCC/AIR) before quoting.";

const base: Omit<CaseBrief, "caseName" | "citation" | "court" | "date"> = {
  bench: "",
  facts: "",
  proceduralHistory: "",
  issues: [],
  petitionerArguments: "",
  respondentArguments: "",
  statutes: [],
  precedents: [],
  reasoning: "",
  decision: "",
  ratio: [],
  obiter: [],
  principles: [],
  examSummary: "",
  pointsToRemember: [],
  thirtySecond: "",
  oneMinute: "",
  beginner: "",
  examOutline: [],
  missing: [],
  confidence: "medium",
  generatedBy: "curated",
};

function brief(
  input: Pick<CaseBrief, "caseName" | "citation" | "court" | "date"> & Partial<CaseBrief>,
): CaseBrief {
  const merged: CaseBrief = { ...base, ...input };
  return {
    ...merged,
    missing: [
      "Paragraph-level pin cites — confirm in the official reporter before citing.",
      ...(input.missing ?? []),
    ],
  };
}

function judgment(
  doc: Omit<SeedDocument, "kind" | "docType" | "sourceUrl" | "verification" | "year" | "court" | "citation"> & {
    year: number;
    court: string;
    citation: string;
    brief: CaseBrief;
  },
): SeedDocument {
  return {
    ...doc,
    kind: "judgment",
    docType: "Judgment",
    sourceUrl: SCI,
    verification: "unverified",
    meta: {
      tags: doc.meta?.tags ?? ["landmark"],
      bench: doc.brief.bench || undefined,
      verificationNote: VERIFY,
      ...doc.meta,
    },
  };
}

export const SEED_CASES: SeedDocument[] = [
  judgment({
    id: "case-kesavananda",
    title: "Kesavananda Bharati v. State of Kerala",
    subtitle: "The basic structure doctrine",
    citation: "(1973) 4 SCC 225; AIR 1973 SC 1461",
    court: "Supreme Court of India",
    year: 1973,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Kesavananda Bharati Sripadagalvaru v. State of Kerala",
      citation: "(1973) 4 SCC 225; AIR 1973 SC 1461",
      court: "Supreme Court of India",
      date: "24 April 1973",
      bench: "13-judge Constitution Bench (Sikri CJI presiding)",
      facts:
        "The head of the Edneer Mutt in Kerala challenged the Kerala Land Reforms Act, 1963 and its amendments, which restricted the Mutt's rights over its lands. The petition grew into a challenge to the Constitution (Twenty-fourth, Twenty-fifth and Twenty-ninth Amendment) Acts, which had curtailed fundamental rights to property and expanded Parliament's amending power.",
      proceduralHistory:
        "The challenge reached a 13-judge Bench directly under Article 32, after the earlier decision in Golaknath (1967) had held that fundamental rights could not be amended.",
      issues: [
        "Is the power of Parliament to amend the Constitution under Article 368 unlimited?",
        "Can an amendment abrogate or damage fundamental rights?",
        "What is the effect of the Twenty-fourth Amendment, which inserted Article 368(3)?",
      ],
      petitionerArguments:
        "The amending power is a delegated power that cannot be used to destroy the Constitution itself; fundamental rights are a limitation on amendment; Golaknath correctly held that rights cannot be abridged by amendment.",
      respondentArguments:
        "Article 368 confers constituent power, not ordinary legislative power; the words “any provision of this Constitution” are wide enough to include fundamental rights; the amending body is sovereign within the constitutional scheme.",
      statutes: [
        "Constitution of India, Arts. 13, 19(1)(f), 31, 32, 368",
        "Constitution (24th Amendment) Act, 1971",
        "Constitution (25th Amendment) Act, 1971",
        "Kerala Land Reforms Act, 1963",
      ],
      precedents: ["Shankari Prasad (1951)", "Sajjan Singh (1965)", "Golaknath (1967)"],
      reasoning:
        "Seven judges held that the amending power is wide but not unlimited: it cannot be exercised so as to destroy the basic structure or framework of the Constitution. Six judges dissented. The Court upheld the Twenty-fourth Amendment's procedural changes but rejected the claim of an unlimited amending power, and upheld parts of the Twenty-fifth Amendment while reading down the rest.",
      decision:
        "By a 7:6 majority, the Court held that Parliament cannot amend the Constitution so as to damage or destroy its basic structure. The basic structure doctrine was established; Golaknath was overruled in part.",
      ratio: [
        "The amending power under Article 368 is wide but subject to the implied limitation that the basic structure of the Constitution cannot be destroyed.",
        "Fundamental rights may be amended, but not in a manner that damages the essential features of the Constitution.",
      ],
      obiter: [
        "Individual opinions differed on which features constitute the basic structure; the list is illustrative, not exhaustive.",
      ],
      principles: [
        "Basic structure doctrine",
        "Implied limitations on constituent power",
        "Judicial review as part of the constitutional scheme",
      ],
      examSummary:
        "Kesavananda settled that Article 368 is not a licence to destroy the Constitution. Parliament can amend any provision, including fundamental rights, but the amendment must not damage the basic structure. The doctrine has since been applied to strike down amendments in Indira Nehru Gandhi (1975), Minerva Mills (1980) and Waman Rao (1981).",
      pointsToRemember: [
        "13-judge Bench; 7:6 split on the basic structure limitation.",
        "The doctrine is judge-made; there is no textual list of basic features.",
        "It limits amendment, not ordinary legislation — though ordinary statutes can be tested under the rights themselves.",
        "Basic features commonly cited: supremacy of the Constitution, democracy, secularism, federalism, separation of powers, judicial review.",
      ],
      thirtySecond:
        "Parliament can amend the Constitution, but it cannot destroy its basic structure. Kesavananda (1973) read this limitation into Article 368 and struck down the idea of unlimited amending power.",
      oneMinute:
        "The Mutt's land dispute became the vehicle for a 13-judge review of Article 368. By 7:6, the Supreme Court held that the amending power is wide but impliedly limited: an amendment cannot damage the basic structure of the Constitution. The judgment upheld the Twenty-fourth Amendment's procedural changes while rejecting unlimited constituent power, and overruled Golaknath in part. Its practical effect is that every constitutional amendment can be tested for structural damage, not merely for procedural compliance.",
      beginner:
        "Think of the Constitution as a building with a load-bearing frame. Parliament is allowed to renovate rooms — even important ones — but it cannot knock down the frame, or the building falls. Kesavananda said the courts will check whether an amendment removes a load-bearing feature. The judges did not agree on the complete list of load-bearing features, but they agreed the limit exists.",
      examOutline: [
        "Introduce Article 368 and the textual argument for unlimited amending power.",
        "Trace Shankari Prasad → Sajjan Singh → Golaknath → Kesavananda.",
        "State the 7:6 holding and the precise scope of the limitation.",
        "Explain how the doctrine has been applied (Indira Nehru Gandhi, Minerva Mills).",
        "Critique: undemocratic? counter-majoritarian? defend with the distinction between constituent and constituted power.",
        "Conclude with the doctrine's stability and its role in protecting federalism, secularism and judicial review.",
      ],
    }),
  }),
  judgment({
    id: "case-maneka",
    title: "Maneka Gandhi v. Union of India",
    subtitle: "Due process in Article 21",
    citation: "(1978) 1 SCC 248",
    court: "Supreme Court of India",
    year: 1978,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Maneka Gandhi v. Union of India",
      citation: "(1978) 1 SCC 248",
      court: "Supreme Court of India",
      date: "25 January 1978",
      bench: "7-judge Constitution Bench (Beg CJI presiding)",
      facts:
        "Maneka Gandhi's passport was impounded by the Central Government under section 10(3)(c) of the Passports Act, 1967 on “public interest” grounds. She was not given reasons and was effectively prevented from travelling abroad. She challenged the order under Article 32.",
      proceduralHistory:
        "A writ petition was filed directly in the Supreme Court; the case was heard by a seven-judge Bench because it required reconsideration of A.K. Gopalan (1950).",
      issues: [
        "Does the procedure contemplated by Article 21 have to be fair, just and reasonable?",
        "Are Articles 14, 19 and 21 to be read together or as watertight compartments?",
        "Does the impounding of a passport without reasons violate Article 21?",
      ],
      petitionerArguments:
        "The Passports Act does not provide for a hearing; the order was arbitrary and unreasoned; the right to travel abroad is part of personal liberty; Article 21 cannot be satisfied by any procedure however unfair.",
      respondentArguments:
        "The procedure was established by law; national security and public interest justified confidentiality; Article 21 is confined to physical liberty and Article 19 does not apply to foreign travel.",
      statutes: ["Constitution of India, Arts. 14, 19(1)(a), 19(1)(g), 21, 32", "Passports Act, 1967, s. 10(3)(c)"],
      precedents: ["A.K. Gopalan v. State of Madras (1950)", "Kharak Singh v. State of U.P. (1963)", "Satwant Singh Sawhney (1967)"],
      reasoning:
        "The Court held that Article 21's “procedure established by law” must be right, just and fair, not arbitrary or fanciful. The fundamental rights are not mutually exclusive: a law affecting personal liberty must satisfy Article 14 and, where applicable, Article 19 as well. The Passports Act's procedure was read to require reasons and an opportunity to be heard, and the impounding order was quashed.",
      decision:
        "The impounding order was set aside. The Court read down section 10(3)(c) to require compliance with natural justice and held that Article 21 includes a fair procedure.",
      ratio: [
        "The procedure under Article 21 must be fair, just and reasonable and must satisfy natural justice.",
        "Articles 14, 19 and 21 form a mutually reinforcing scheme; a restriction on liberty must satisfy all applicable guarantees.",
      ],
      obiter: [
        "Bhagwati J's opinion treated the right to travel abroad as part of personal liberty, an idea later absorbed into the Article 21 jurisprudence.",
      ],
      principles: [
        "Due process and natural justice",
        "Interrelationship of fundamental rights",
        "Reasoned administrative orders affecting liberty",
      ],
      examSummary:
        "Maneka Gandhi is the pivot from the A.K. Gopalan compartmental view to a connected reading of Articles 14, 19 and 21. “Procedure established by law” now imports fairness, non-arbitrariness and natural justice. It is the doctrinal gateway to privacy, dignity and the modern proportionality standard.",
      pointsToRemember: [
        "Overruled A.K. Gopalan's compartmental approach.",
        "Read with Article 14 to prohibit arbitrary procedure.",
        "Applied in later cases on passports, travel and administrative fairness.",
      ],
      thirtySecond:
        "Article 21's “procedure established by law” must be fair, just and reasonable — not any procedure the legislature chooses. Maneka Gandhi fused Articles 14, 19 and 21 into one scheme of liberty.",
      oneMinute:
        "Maneka Gandhi's passport was impounded without reasons. A seven-judge Bench held that personal liberty under Article 21 can only be curtailed by a procedure that is fair, just and reasonable, and that Articles 14, 19 and 21 must be read together. Section 10(3)(c) of the Passports Act was read down to require natural justice, and the order was quashed. The case marks the shift from a narrow, compartmental reading of fundamental rights to a connected, substantive one.",
      beginner:
        "Before 1978, the Court said that if a law prescribed some procedure, Article 21 was satisfied. Maneka changed that: the procedure itself must be fair. If the government takes away your liberty, it must have a lawful basis, act for a proper purpose, and give you a chance to be heard. That is the idea behind every modern Article 21 case.",
      examOutline: [
        "Facts and the impugned order.",
        "The A.K. Gopalan compartmental view and its problems.",
        "The holding: fair, just and reasonable procedure; natural justice.",
        "The Article 14/19/21 interconnection.",
        "Consequences: privacy, dignity, proportionality.",
        "Critically assess: judicial creativity versus separation of powers.",
      ],
    }),
  }),
  judgment({
    id: "case-vishaka",
    title: "Vishaka v. State of Rajasthan",
    subtitle: "Workplace sexual harassment guidelines",
    citation: "(1997) 6 SCC 241",
    court: "Supreme Court of India",
    year: 1997,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Vishaka v. State of Rajasthan",
      citation: "(1997) 6 SCC 241",
      court: "Supreme Court of India",
      date: "13 August 1997",
      bench: "Verma CJI, Sujata V. Manohar and B.N. Kirpal, JJ.",
      facts:
        "Bhanwari Devi, a social worker employed in a Rajasthan government programme, was gang-raped for opposing a child marriage. The trial court acquitted the accused. Women's groups filed a public interest petition seeking enforcement of the fundamental rights of working women against sexual harassment.",
      proceduralHistory:
        "A writ petition under Article 32 was filed by Vishaka and other NGOs after the criminal trial ended in acquittal and no workplace safeguards existed.",
      issues: [
        "Do the fundamental rights under Articles 14, 15, 19(1)(g) and 21 include protection against sexual harassment at the workplace?",
        "Can the Court lay down binding guidelines in the absence of legislation?",
        "How should international conventions be used to interpret fundamental rights?",
      ],
      petitionerArguments:
        "Sexual harassment violates equality, the right to carry on an occupation, and the right to live with dignity; the State has a duty to protect working women; CEDAW obliges India to eliminate discrimination and violence at work.",
      respondentArguments:
        "Workplace harassment is a matter for legislation, not judicial guidelines; the criminal acquittal meant the allegations were unproven; the State had no statutory scheme to enforce.",
      statutes: [
        "Constitution of India, Arts. 14, 15, 19(1)(g), 21, 32",
        "Convention on the Elimination of All Forms of Discrimination Against Women (CEDAW)",
      ],
      precedents: ["Nilabati Behera (1993)", "Jolly George Varghese (1980)"],
      reasoning:
        "The Court held that sexual harassment is a form of sex discrimination and a violation of dignity. Relying on CEDAW and the Beijing Statement, it framed the Vishaka Guidelines: a definition of harassment, preventive duties, a complaints committee, disciplinary action, and protection against retaliation. The guidelines were to operate as law under Article 141 until Parliament legislated.",
      decision:
        "The Court issued binding guidelines for employers and institutions, applicable throughout India, and directed their circulation by the Union and States. The guidelines remained in force until the Sexual Harassment of Women at Workplace Act, 2013.",
      ratio: [
        "Sexual harassment at the workplace violates Articles 14, 15, 19(1)(g) and 21.",
        "In the absence of domestic legislation, international conventions can inform the content of fundamental rights.",
        "The Court can issue guidelines under Article 32 to enforce fundamental rights, binding under Article 141 until legislation.",
      ],
      obiter: ["The Court recommended that Parliament enact a comprehensive statute on workplace harassment."],
      principles: [
        "Dignity at work",
        "Horizontal application of constitutional values to employers",
        "Use of international law to interpret fundamental rights",
        "Judicial legislation as an interim remedy",
      ],
      examSummary:
        "Vishaka created enforceable workplace harassment norms through Article 32, using CEDAW. It is the leading Indian example of the Court filling a legislative vacuum to protect dignity and equality. The 2013 Act now occupies the field, but Vishaka remains the doctrinal source and is cited for its method.",
      pointsToRemember: [
        "Guidelines operated as law under Article 141, not as mere advice.",
        "The definition of sexual harassment included unwelcome physical contact, demands, remarks and pornography.",
        "The 2013 Act replaced the guidelines with a statutory mechanism (Internal Committee, Local Committee).",
      ],
      thirtySecond:
        "In the absence of a statute, the Supreme Court used Article 32 and CEDAW to create binding workplace sexual harassment guidelines. Harassment was recognised as sex discrimination violating Articles 14, 15, 19(1)(g) and 21.",
      oneMinute:
        "After Bhanwari Devi's assault and the accused's acquittal, a PIL asked the Supreme Court to protect working women. The Court held that sexual harassment violates equality, occupational freedom and dignity, and framed the Vishaka Guidelines: a definition, preventive measures, complaints committees, disciplinary consequences and confidentiality. The guidelines were binding law under Article 141 until Parliament enacted the 2013 Act. The case is also a model for reading international conventions into fundamental rights.",
      beginner:
        "In 1997 there was no Indian statute on sexual harassment at work. The Supreme Court said the Constitution's promises of equality and dignity already required protection, and it wrote practical rules itself. Employers had to set up committees, prevent harassment and act on complaints. Parliament later passed a full law, but the Court's reasoning remains the foundation.",
      examOutline: [
        "Facts and the legislative gap.",
        "Constitutional provisions engaged (14, 15, 19(1)(g), 21).",
        "The CEDAW method: international law as an interpretive aid.",
        "The guidelines' content.",
        "Article 141 and judicial legislation — legitimacy and limits.",
        "Aftermath: the 2013 Act.",
      ],
    }),
  }),
  judgment({
    id: "case-puttaswamy",
    title: "K.S. Puttaswamy v. Union of India",
    subtitle: "The right to privacy",
    citation: "(2017) 10 SCC 1",
    court: "Supreme Court of India",
    year: 2017,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
      citation: "(2017) 10 SCC 1",
      court: "Supreme Court of India",
      date: "24 August 2017",
      bench: "9-judge Constitution Bench (Khehar CJI presiding)",
      facts:
        "A retired judge challenged the Aadhaar scheme and the collection of biometric data. The petition raised the prior question whether privacy is a fundamental right, since M.P. Sharma (1954) and Kharak Singh (1963) had held that it was not.",
      proceduralHistory:
        "The matter was referred to a nine-judge Bench to settle the status of privacy; the merits of Aadhaar were left to a later Bench.",
      issues: [
        "Is the right to privacy a fundamental right under the Constitution?",
        "If so, which Articles protect it and what is the standard for restricting it?",
        "Do M.P. Sharma and Kharak Singh still hold the field?",
      ],
      petitionerArguments:
        "Privacy is inherent in dignity and liberty; it protects informational self-determination; the earlier decisions reflected an era before data-driven governance and should be overruled.",
      respondentArguments:
        "The Constitution does not expressly mention privacy; the earlier decisions were correctly decided; privacy claims must yield to welfare schemes and national security.",
      statutes: ["Constitution of India, Arts. 14, 19, 21, 32"],
      precedents: ["M.P. Sharma (1954)", "Kharak Singh (1963)", "Gobind v. State of M.P. (1975)", "PUCL (1997)"],
      reasoning:
        "All nine judges agreed that privacy is protected as an intrinsic part of life and liberty under Article 21 and as part of the freedoms in Part III. The Court overruled M.P. Sharma and the contrary observations in Kharak Singh. Plurality opinions converged on a three-fold test for infringement: legality (an existing law), a legitimate State aim, and proportionality.",
      decision:
        "Privacy was declared a fundamental right. Restrictions must satisfy legality, legitimate aim and proportionality. M.P. Sharma was overruled and Kharak Singh partially overruled.",
      ratio: [
        "Privacy is a fundamental right flowing from dignity, liberty and the guarantees in Part III.",
        "Any invasion must be backed by law, pursue a legitimate aim, and be proportionate.",
      ],
      obiter: [
        "Opinions discussed informational privacy, bodily autonomy and the need for a data protection law.",
      ],
      principles: [
        "Privacy as an intrinsic part of Article 21",
        "Proportionality standard",
        "Informational self-determination",
      ],
      examSummary:
        "Puttaswamy is the foundation of Indian privacy jurisprudence. Nine judges held privacy to be a fundamental right, overruled the old contrary view, and supplied a three-part test. The Aadhaar merits were decided separately in 2018, upholding the scheme with safeguards.",
      pointsToRemember: [
        "Unanimous on the existence of the right; six separate opinions on reasoning.",
        "Three-fold test: legality, legitimate aim, proportionality.",
        "Overruled M.P. Sharma; partially overruled Kharak Singh.",
        "Basis for later challenges to surveillance and data practices.",
      ],
      thirtySecond:
        "Privacy is a fundamental right under Article 21 and Part III. Any intrusion needs a law, a legitimate aim and proportionality. Puttaswamy (2017) overruled the old view that privacy was unprotected.",
      oneMinute:
        "A nine-judge Bench was asked whether privacy is a fundamental right. It answered yes: privacy is intrinsic to dignity and liberty, and flows from Articles 14, 19 and 21. The Court overruled M.P. Sharma and the contrary observations in Kharak Singh, and held that restrictions must be legal, serve a legitimate aim and be proportionate. The Aadhaar scheme itself was examined later; in 2018 the Court upheld it with conditions, including limits on data sharing.",
      beginner:
        "Privacy is not a separate article in the Constitution, but the Supreme Court held it is part of the dignity and liberty that Article 21 protects. That means the State cannot collect, share or intrude into your personal life without a law, a good reason, and a proportionate method. This is why data protection debates in India start with Puttaswamy.",
      examOutline: [
        "Facts and the reference to nine judges.",
        "The pre-2017 position: M.P. Sharma, Kharak Singh, Gobind.",
        "The holding: privacy under Article 21 and Part III.",
        "The three-fold proportionality test.",
        "Application to Aadhaar and data protection.",
        "Critique and future questions (surveillance, facial recognition).",
      ],
    }),
  }),
  judgment({
    id: "case-navtej",
    title: "Navtej Singh Johar v. Union of India",
    subtitle: "Section 377 and consensual same-sex relations",
    citation: "(2018) 10 SCC 1",
    court: "Supreme Court of India",
    year: 2018,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Navtej Singh Johar v. Union of India",
      citation: "(2018) 10 SCC 1",
      court: "Supreme Court of India",
      date: "6 September 2018",
      bench: "5-judge Constitution Bench (Dipak Misra CJI presiding)",
      facts:
        "A group of petitioners, including LGBTQ+ activists and individuals, challenged section 377 of the IPC insofar as it criminalised consensual sexual acts between adults of the same sex. They relied on Puttaswamy, dignity, equality and freedom of expression.",
      proceduralHistory:
        "The petitions were referred to a five-judge Bench in light of the nine-judge privacy decision, requiring reconsideration of Suresh Kumar Koushal (2013).",
      issues: [
        "Does section 377, as applied to consensual same-sex acts between adults, violate Articles 14, 15, 19 and 21?",
        "Should Koushal be overruled?",
        "What is the constitutional status of sexual orientation and identity?",
      ],
      petitionerArguments:
        "Section 377 criminalises identity and private intimacy; it is vague, overbroad and disproportionate; it denies equal citizenship and dignity; privacy protects consensual adult relationships.",
      respondentArguments:
        "Section 377 was enacted to protect public morality and health; the legislature, not the Court, should change it; the provision also covers non-consensual acts.",
      statutes: ["Indian Penal Code, 1860, s. 377", "Constitution of India, Arts. 14, 15, 19(1)(a), 21"],
      precedents: ["Naz Foundation (2009, Delhi HC)", "Suresh Kumar Koushal (2013)", "Puttaswamy (2017)"],
      reasoning:
        "The Court held that section 377, insofar as it penalises consensual sexual acts between adults, violates equality, non-discrimination, freedom of expression and life with dignity. It applied the Puttaswamy proportionality framework and held that moral disapproval is not a legitimate aim for criminal law. Koushal was overruled. The Court read down the section rather than striking it down entirely, so non-consensual acts remain punishable.",
      decision:
        "Section 377 was declared unconstitutional to the extent it criminalised consensual sexual acts between adults. Koushal was overruled.",
      ratio: [
        "Criminalising consensual same-sex intimacy violates Articles 14, 15, 19 and 21.",
        "Sexual orientation is an aspect of identity protected by dignity and privacy.",
        "Popular morality or majoritarian disapproval cannot justify criminalisation.",
      ],
      obiter: [
        "The judges differed on the precise interpretation of “sex” under Article 15 but agreed on the outcome.",
      ],
      principles: [
        "Dignity and identity",
        "Proportionality in criminalisation",
        "Anti-majoritarian role of courts",
      ],
      examSummary:
        "Navtej read down section 377 to decriminalise consensual adult same-sex relations, overruling Koushal and applying Puttaswamy. It is the leading case on dignity, identity and the limits of morality as a legislative aim.",
      pointsToRemember: [
        "Section 377 survives for non-consensual and bestiality cases.",
        "Koushal (2013) overruled.",
        "Five separate opinions, unanimous outcome.",
        "The judgment does not legalise same-sex marriage; that is a separate question.",
      ],
      thirtySecond:
        "The Supreme Court read down section 377 to decriminalise consensual same-sex acts between adults. Dignity, privacy and equality outweigh moral disapproval. Koushal was overruled.",
      oneMinute:
        "Navtej challenged section 377's application to consensual adult same-sex relationships. A five-judge Bench applied the Puttaswamy privacy and proportionality framework, held that sexual orientation is part of protected identity, and overruled Koushal. Section 377 remains for non-consensual acts. The decision is the leading Indian authority on dignity, moral disapproval as an illegitimate aim, and the anti-majoritarian role of constitutional courts.",
      beginner:
        "Section 377 was a colonial-era provision that criminalised certain sexual acts, including consensual sex between adults of the same sex. In 2018 the Supreme Court said that part of the section cannot apply to consenting adults: the Constitution protects dignity, privacy and equality, and disapproval by the majority is not a good enough reason to send people to prison.",
      examOutline: [
        "The text of section 377 and its colonial history.",
        "Koushal and its reasoning.",
        "Puttaswamy's proportionality test.",
        "Equality, non-discrimination and freedom of expression arguments.",
        "Holding and the limits of the reading down.",
        "Aftermath: marriage equality litigation and the continuing debate.",
      ],
    }),
  }),
  judgment({
    id: "case-lalita",
    title: "Lalita Kumari v. Government of U.P.",
    subtitle: "Mandatory registration of FIRs",
    citation: "(2014) 2 SCC 1",
    court: "Supreme Court of India",
    year: 2013,
    subject: "Criminal Procedure",
    brief: brief({
      caseName: "Lalita Kumari v. Government of Uttar Pradesh",
      citation: "(2014) 2 SCC 1",
      court: "Supreme Court of India",
      date: "12 November 2013",
      bench: "5-judge Constitution Bench (P. Sathasivam CJI presiding)",
      facts:
        "The petition arose from a refusal by police to register an FIR on a complaint disclosing a cognizable offence, and the resulting failure to investigate. The question was referred to a Constitution Bench after conflicting decisions on whether a preliminary inquiry is permissible before registration.",
      proceduralHistory:
        "A writ petition under Article 32 led to a reference to a five-judge Bench to settle the practice across States.",
      issues: [
        "Is registration of an FIR mandatory when information discloses a cognizable offence?",
        "Can the police conduct a preliminary inquiry before registering an FIR?",
        "What are the consequences of non-registration?",
      ],
      petitionerArguments:
        "Section 154 uses “shall”; a discretionary inquiry allows police to screen complaints and defeats the right to investigation; the informant has a right to have the offence registered.",
      respondentArguments:
        "A limited inquiry helps avoid frivolous complaints and protects citizens from malicious prosecutions; the police need discretion to verify credibility.",
      statutes: [
        "Code of Criminal Procedure, 1973, ss. 154, 156, 157, 162",
        "Indian Penal Code, s. 166A (inserted in 2013)",
      ],
      precedents: ["State of Haryana v. Bhajan Lal (1992)", "Rajinder Singh Katoch (2007)"],
      reasoning:
        "The Court held that the word “shall” in section 154 makes registration mandatory where the information discloses a cognizable offence. A preliminary inquiry is permitted only in a limited category of cases — matrimonial and family disputes, commercial offences, medical negligence, corruption, and cases where delay has been explained — and must be completed within a fixed time. Refusal to register is punishable.",
      decision:
        "Registration of an FIR is mandatory under section 154 for cognizable offences. Preliminary inquiry is an exception confined to identified categories and must be time-bound. Section 166A IPC was inserted to penalise non-registration.",
      ratio: [
        "Section 154 is mandatory; the police have no discretion to refuse registration when a cognizable offence is disclosed.",
        "Preliminary inquiry is permissible only in the limited categories recognised by the Court, and must be time-bound.",
      ],
      obiter: ["The Court recommended that the Union and States frame rules and maintain complaint registers."],
      principles: [
        "Mandatory FIR registration",
        "Limited preliminary inquiry",
        "Accountability for non-registration",
      ],
      examSummary:
        "Lalita Kumari settled a long-standing conflict: if the information discloses a cognizable offence, the FIR must be registered. A preliminary inquiry is a narrow, time-bound exception for specific categories. The decision recognises registration as the gateway to investigation and to the victim's access to justice.",
      pointsToRemember: [
        "The test is whether the information discloses a cognizable offence, not whether it is true.",
        "The categories permitting preliminary inquiry are illustrative, not exhaustive.",
        "Section 166A IPC (now BNS) punishes a public servant who refuses to register.",
        "The FIR is not substantive evidence; it is used to corroborate or contradict.",
      ],
      thirtySecond:
        "If a complaint discloses a cognizable offence, the police must register an FIR — no discretion. A preliminary inquiry is allowed only in narrow, time-bound categories. Lalita Kumari (2013) made this mandatory.",
      oneMinute:
        "The Supreme Court resolved conflicting precedents on whether police can screen complaints before registering an FIR. It held that section 154 CrPC uses “shall”: registration is mandatory once the information discloses a cognizable offence. A preliminary inquiry is permissible only in categories such as matrimonial disputes, commercial offences, medical negligence and corruption, and must be completed within a fixed period. Non-registration is now punishable, and the FIR remains the gateway to investigation.",
      beginner:
        "If you go to a police station and describe a crime that police are allowed to investigate without a magistrate's order, they must write it down as an FIR. They cannot say “we will see” and send you away. The Supreme Court said the only exception is a short, time-bound check in specific kinds of cases, like family disputes or medical negligence allegations.",
      examOutline: [
        "Section 154 and the meaning of a cognizable offence.",
        "The conflicting precedents and the reference.",
        "The holding: mandatory registration.",
        "The limited preliminary inquiry and its safeguards.",
        "Consequences of non-registration; section 166A.",
        "Evaluate: does mandatory registration increase frivolous complaints?",
      ],
    }),
  }),
  judgment({
    id: "case-arnesh",
    title: "Arnesh Kumar v. State of Bihar",
    subtitle: "Arrest guidelines for offences up to seven years",
    citation: "(2014) 8 SCC 273",
    court: "Supreme Court of India",
    year: 2014,
    subject: "Criminal Procedure",
    brief: brief({
      caseName: "Arnesh Kumar v. State of Bihar",
      citation: "(2014) 8 SCC 273",
      court: "Supreme Court of India",
      date: "2 July 2014",
      bench: "Chandramauli Kumar Prasad and Pinaki Chandra Ghose, JJ.",
      facts:
        "The appellant's wife lodged an FIR under section 498A IPC and section 4 of the Dowry Prohibition Act. He applied for anticipatory bail, and the case became the occasion for the Supreme Court to examine automatic arrests in offences punishable with up to seven years.",
      proceduralHistory:
        "The matter reached the Supreme Court through a special leave petition against the refusal of anticipatory bail by the High Court.",
      issues: [
        "Is arrest mandatory in every case punishable with up to seven years?",
        "What must a police officer and a magistrate consider before arrest and detention?",
        "What safeguards can the Court lay down under Article 142?",
      ],
      petitionerArguments:
        "Automatic arrest in matrimonial complaints destroys liberty and families; section 41 CrPC requires a necessity assessment; magistrates authorise detention mechanically.",
      respondentArguments:
        "Arrest is a legitimate investigative tool; the allegations are serious; guidelines cannot replace statutory discretion.",
      statutes: [
        "Code of Criminal Procedure, 1973, ss. 41, 41A, 41B, 57, 167, 437",
        "Indian Penal Code, ss. 498A, 304B",
        "Dowry Prohibition Act, 1961, s. 4",
      ],
      precedents: ["Joginder Kumar v. State of U.P. (1994)", "D.K. Basu (1997)"],
      reasoning:
        "The Court held that section 41(1) does not require arrest in every case; the necessity test in section 41(2) must be applied. For offences punishable with up to seven years, police should ordinarily issue a notice under section 41A rather than arrest. Magistrates must not authorise detention without recording why custody is necessary, and non-compliance should attract departmental action and contempt.",
      decision:
        "The Court issued binding guidelines: police must satisfy the necessity test, issue 41A notices in applicable cases, and record reasons; magistrates must apply their mind before authorising detention. The appeal was disposed of with these directions.",
      ratio: [
        "Arrest is not automatic for offences punishable with up to seven years; the necessity test in section 41(2) must be applied.",
        "Magistrates must independently examine the need for custody before authorising remand.",
      ],
      obiter: ["The Court asked the States to train police officers on the guidelines."],
      principles: [
        "Arrest as a last resort",
        "Judicial scrutiny of remand",
        "Liberty under Article 21"
      ],
      examSummary:
        "Arnesh Kumar operationalises the 2010 amendment to section 41. It insists on a necessity assessment, a 41A notice in offences up to seven years, and an independent judicial check at remand. It is the leading case on avoiding mechanical arrest in matrimonial and similar complaints.",
      pointsToRemember: [
        "Section 41(2) necessity test is mandatory, not advisory.",
        "Section 41A notice is the default for offences punishable up to seven years.",
        "Remand orders must record reasons; mechanical authorisation is illegal.",
        "Non-compliance can lead to departmental action and contempt.",
      ],
      thirtySecond:
        "Arrest is not automatic for offences punishable up to seven years. Police must apply the section 41(2) necessity test and ordinarily issue a 41A notice; magistrates must independently justify remand. Arnesh Kumar (2014).",
      oneMinute:
        "Arnesh Kumar's matrimonial FIR became the vehicle for guidelines on arrest. The Supreme Court held that section 41 CrPC requires a case-by-case necessity assessment, that a notice under 41A should ordinarily precede arrest in offences punishable up to seven years, and that magistrates must not authorise detention mechanically. Breach attracts departmental action and contempt. The decision is the practical companion to D.K. Basu's custody safeguards.",
      beginner:
        "The law does not say “arrest everyone accused of a crime”. Before arresting, the police must ask whether arrest is actually needed — to stop further offences, protect evidence, or ensure court attendance. For less serious offences, they should usually send a notice asking the person to appear. A magistrate must also check the reasons before sending someone to custody.",
      examOutline: [
        "Section 41 and the 2010 necessity test.",
        "The facts and the automatic-arrest problem.",
        "Holding: guidelines on police and magistrates.",
        "Section 41A notice procedure.",
        "Remand scrutiny under section 167.",
        "Critique: implementation gaps and the data on arrests.",
      ],
    }),
  }),
  judgment({
    id: "case-dk-basu",
    title: "D.K. Basu v. State of West Bengal",
    subtitle: "Custodial safeguards and compensation",
    citation: "(1997) 1 SCC 416",
    court: "Supreme Court of India",
    year: 1996,
    subject: "Criminal Procedure",
    brief: brief({
      caseName: "D.K. Basu v. State of West Bengal",
      citation: "(1997) 1 SCC 416",
      court: "Supreme Court of India",
      date: "18 December 1996",
      bench: "A.S. Anand and M.K. Mukherjee, JJ.",
      facts:
        "A public interest petition was filed by the Executive Chairman of Legal Aid Services, West Bengal, following reports of custodial deaths and torture in police lock-ups. The Court examined the absence of procedural safeguards for arrested persons.",
      proceduralHistory:
        "The petition was heard as a continuing matter under Article 32, with the Court monitoring compliance and issuing interim directions.",
      issues: [
        "What safeguards are required to protect arrested persons from custodial torture and death?",
        "Does compensation lie in public law for violation of fundamental rights?",
        "What is the effect of the guidelines until legislation is enacted?",
      ],
      petitionerArguments:
        "Custodial violence is widespread and invisible; existing safeguards are inadequate; the Court should lay down enforceable procedures and award compensation.",
      respondentArguments:
        "The State denied systematic abuse; guidelines would hamper investigation; existing criminal law provides remedies.",
      statutes: ["Constitution of India, Arts. 21, 22, 32", "Code of Criminal Procedure, 1973, ss. 41, 49, 54, 57"],
      precedents: ["Nilabati Behera (1993)", "Rudul Sah (1983)", "Joginder Kumar (1994)"],
      reasoning:
        "The Court held that custodial torture violates Article 21 and human dignity, and that public law compensation is available where constitutional rights are violated. It laid down eleven requirements, including an arrest memo signed by a witness, information to a friend or relative, medical examination, entry in the station diary, identification of arresting officers, and a right to meet a lawyer.",
      decision:
        "The Court issued the D.K. Basu guidelines, binding on all States and police forces until legislation, and affirmed the availability of compensation for custodial violations.",
      ratio: [
        "Custodial torture and death violate Article 21 and the right to dignity.",
        "Public law compensation is a remedy for violation of fundamental rights.",
        "Arrest and custody must follow documented safeguards.",
      ],
      obiter: ["The Court urged Parliament to enact a law on custodial crimes."],
      principles: [
        "Custodial safeguards",
        "Public law compensation",
        "Dignity of the arrested person",
        "Police accountability",
      ],
      examSummary:
        "D.K. Basu is the constitutional baseline for arrest and custody. Its eleven safeguards operationalise Articles 21 and 22, and its compensation doctrine makes the State liable for custodial abuse. It remains the starting point for any question on custodial death, torture or the rights of arrested persons.",
      pointsToRemember: [
        "Arrest memo, witness signature, and information to family.",
        "Medical examination and entry in the station diary.",
        "Right to meet a lawyer during interrogation.",
        "Guidelines are binding until legislation.",
      ],
      thirtySecond:
        "D.K. Basu laid down eleven mandatory safeguards for arrested persons and held that custodial torture violates Article 21, with public law compensation available to victims.",
      oneMinute:
        "Responding to custodial deaths, the Supreme Court created a code of arrest safeguards: an arrest memo attested by a witness, information to a relative, medical examination, a station diary entry, identification of officers, and access to a lawyer. It held that custodial violence violates Article 21 and that compensation can be awarded in public law. The guidelines bind all police forces until Parliament legislates.",
      beginner:
        "When police arrest someone, the law requires a paper trail so the person cannot simply disappear. D.K. Basu set out practical steps: record who arrested you and why, tell your family, get a medical check-up, and let you meet a lawyer. If police violate these rules and someone is hurt, the State can be ordered to pay compensation.",
      examOutline: [
        "Facts and the custodial violence context.",
        "Article 21 and 22 guarantees.",
        "The eleven safeguards.",
        "Public law compensation: Nilabati Behera line.",
        "Enforcement problems and NHRC data.",
        "Reform: police custody law and body cameras.",
      ],
    }),
  }),
  judgment({
    id: "case-indra-sawhney",
    title: "Indra Sawhney v. Union of India",
    subtitle: "OBC reservation, creamy layer and the 50% ceiling",
    citation: "1992 Supp (3) SCC 217",
    court: "Supreme Court of India",
    year: 1992,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Indra Sawhney v. Union of India",
      citation: "1992 Supp (3) SCC 217",
      court: "Supreme Court of India",
      date: "16 November 1992",
      bench: "9-judge Constitution Bench",
      facts:
        "The Union implemented the Mandal Commission's recommendation of 27% reservation for Other Backward Classes in central services. The Office Memorandum was challenged by candidates and associations alleging that caste-based reservation violated equality and merit.",
      proceduralHistory:
        "A batch of writ petitions was heard by a nine-judge Bench, with interim orders protecting existing appointments during the hearing.",
      issues: [
        "Is reservation for OBCs under Article 16(4) constitutionally valid?",
        "Can reservation exceed 50% of available posts?",
        "What is the “creamy layer” and must it be excluded?",
        "Can reservation apply to promotions?",
      ],
      petitionerArguments:
        "Caste is not a permissible basis for reservation after the initial period; reservation undermines merit and efficiency; the Mandal criteria are vague and overbroad.",
      respondentArguments:
        "Article 16(4) expressly permits reservation for backward classes; social and educational backwardness persists; the Commission used available data and the policy is a executive decision within constitutional limits.",
      statutes: ["Constitution of India, Arts. 14, 15(4), 16(1), 16(4), 16(4A), 335, 340"],
      precedents: ["State of Madras v. Champakam Dorairajan (1951)", "M.R. Balaji (1963)", "Thomas (1976)", "Kesavananda (1973)"],
      reasoning:
        "The Court upheld 27% reservation for OBCs but held that the “creamy layer” must be excluded so that the benefit reaches the genuinely backward. It fixed a 50% ceiling on reservations in the absence of extraordinary circumstances, held that Article 16(4) is an enabling provision, and that reservation in promotions was not permissible at that time (later addressed by the 77th Amendment).",
      decision:
        "OBC reservation was upheld subject to the exclusion of the creamy layer and the 50% ceiling. Reservation in promotions was held impermissible; the Court also clarified that Article 16(4) is not an exception to Article 16(1) but a facet of equality.",
      ratio: [
        "Reservation under Article 16(4) is valid but must exclude the creamy layer.",
        "Total reservation should ordinarily not exceed 50% of available posts.",
        "Article 16(4) is an enabling provision, not a source of a fundamental right to reservation.",
      ],
      obiter: [
        "The Court suggested that reservation should be reviewed periodically and that the backward class commission should be consulted.",
      ],
      principles: [
        "Substantive equality",
        "Creamy layer exclusion",
        "50% ceiling",
        "Administrative efficiency under Article 335",
      ],
      examSummary:
        "Indra Sawhney is the structural case on reservation. It upheld OBC reservation while imposing the creamy layer exclusion and the 50% ceiling, and treated Article 16(4) as a facet of equality rather than an exception. Later amendments and cases (77th, 81st, 85th, 102nd, 103rd, 105th) have modified specific outcomes but not this framework.",
      pointsToRemember: [
        "Nine judges; multiple opinions; the operative conclusions are what matter.",
        "Creamy layer applies to OBCs, not to SCs/STs.",
        "50% ceiling can be exceeded only in extraordinary situations.",
        "Reservation in promotions required a constitutional amendment (77th).",
      ],
      thirtySecond:
        "OBC reservation is valid, but the creamy layer must be excluded and total reservation should not exceed 50%. Indra Sawhney (1992) treats Article 16(4) as part of equality, not an exception to it.",
      oneMinute:
        "The Mandal Commission's 27% OBC quota was challenged before nine judges. The Court upheld it, but imposed two structural limits: the creamy layer must be excluded, and reservations should ordinarily stay within 50% of posts. It held that Article 16(4) is an enabling provision and that reservation in promotions was not then permissible, a position reversed by the 77th Amendment. The case remains the framework for every subsequent reservation dispute.",
      beginner:
        "Reservation is allowed under the Constitution for groups that have faced historical disadvantage. Indra Sawhney said it must not become a permanent privilege for well-off families within those groups — the “creamy layer” must be left out — and that reservations should generally not take more than half the seats. It also explained that reservation is a tool to achieve equality, not an exception to it.",
      examOutline: [
        "Constitutional text: Articles 15(4), 16(4), 335, 340.",
        "Mandal Commission and the Office Memorandum.",
        "Holding on 27%, creamy layer and 50% ceiling.",
        "Article 16(4) as a facet of equality.",
        "Later amendments and cases.",
        "Critique: merit, efficiency and substantive equality.",
      ],
    }),
  }),
  judgment({
    id: "case-minerva",
    title: "Minerva Mills v. Union of India",
    subtitle: "Basic structure, judicial review and the 42nd Amendment",
    citation: "(1980) 3 SCC 625",
    court: "Supreme Court of India",
    year: 1980,
    subject: "Constitutional Law",
    brief: brief({
      caseName: "Minerva Mills Ltd. v. Union of India",
      citation: "(1980) 3 SCC 625",
      court: "Supreme Court of India",
      date: "31 July 1980",
      bench: "5-judge Constitution Bench (Chandrachud CJI presiding)",
      facts:
        "Minerva Mills, a textile company, challenged the nationalisation of its undertaking under the Sick Textile Undertakings (Nationalisation) Act, 1974. The case became a challenge to clauses (4) and (5) of Article 368 and to the expanded Article 31C, both inserted by the 42nd Amendment.",
      proceduralHistory:
        "The writ petition was heard by a five-judge Bench after the Emergency, alongside other challenges to the 42nd Amendment.",
      issues: [
        "Are clauses (4) and (5) of Article 368, which exclude judicial review of amendments, valid?",
        "Can Article 31C be expanded to protect laws implementing any directive principle?",
        "What is the relationship between fundamental rights and directive principles?",
      ],
      petitionerArguments:
        "The 42nd Amendment destroyed judicial review and the balance between Parts III and IV; an amendment conferring unlimited amending power is itself a destruction of the basic structure.",
      respondentArguments:
        "Parliament's constituent power is sovereign; the amendment was a legitimate response to judicial interference; directive principles should prevail over fundamental rights in welfare legislation.",
      statutes: [
        "Constitution of India, Arts. 14, 19(1)(f), 31, 31C, 32, 368",
        "Constitution (42nd Amendment) Act, 1976",
        "Sick Textile Undertakings (Nationalisation) Act, 1974",
      ],
      precedents: ["Kesavananda Bharati (1973)", "Indira Nehru Gandhi (1975)", "Golaknath (1967)"],
      reasoning:
        "The Court held clauses (4) and (5) of Article 368 unconstitutional because they excluded judicial review and made amendments immune from challenge, destroying the basic structure. It struck down the expanded Article 31C, holding that the Constitution's harmony between fundamental rights and directive principles is itself a basic feature. The nationalisation law was upheld on other grounds.",
      decision:
        "Article 368(4) and (5) were struck down. The expanded Article 31C was struck down. The balance between Parts III and IV was declared part of the basic structure.",
      ratio: [
        "Judicial review is a basic feature; an amendment that excludes it is invalid.",
        "A limited amending power is itself part of the basic structure.",
        "The balance between fundamental rights and directive principles is a basic feature.",
      ],
      obiter: ["The Court emphasised that rights and directive principles must be read harmoniously, neither being absolute."],
      principles: [
        "Basic structure",
        "Judicial review",
        "Harmony of Parts III and IV",
      ],
      examSummary:
        "Minerva Mills applied Kesavananda to the 42nd Amendment. It invalidated the ouster of judicial review and the expansion of Article 31C, and held that the balance between fundamental rights and directive principles is basic. It is the leading case on the limits of constituent power after Kesavananda.",
      pointsToRemember: [
        "Clauses (4) and (5) of Article 368 were struck down.",
        "Article 31C's expanded version was struck down; the original limited version survived.",
        "Judicial review is a basic feature.",
        "The case is about both rights and the structure of the Constitution.",
      ],
      thirtySecond:
        "Minerva Mills struck down the 42nd Amendment provisions that ousted judicial review and made amendments unchallengeable. Judicial review and the balance between rights and directive principles are part of the basic structure.",
      oneMinute:
        "Minerva Mills challenged the 42nd Amendment's attempt to immunise constitutional amendments and to expand Article 31C. The Supreme Court held that clauses (4) and (5) of Article 368 destroyed judicial review and the limited amending power, both basic features. It also struck down the expanded Article 31C and held that the harmony between fundamental rights and directive principles must be preserved. The case remains the leading application of Kesavananda after the Emergency.",
      beginner:
        "After the Emergency, Parliament tried to make it impossible for courts to review constitutional amendments. Minerva Mills said no: the power to amend is not the power to destroy. Courts must be able to check whether an amendment breaks the Constitution's basic framework, and the Constitution's balance between individual rights and welfare goals cannot be tipped over completely to one side.",
      examOutline: [
        "The 42nd Amendment and the political context.",
        "Kesavananda's basic structure doctrine.",
        "Holding on Article 368(4)-(5): judicial review is basic.",
        "Holding on Article 31C and the Part III/IV balance.",
        "Consequences for later amendments and judicial review.",
        "Critique: judicial supremacy versus parliamentary sovereignty.",
      ],
    }),
  }),
  judgment({
    id: "case-shah-bano",
    title: "Mohd. Ahmed Khan v. Shah Bano Begum",
    subtitle: "Maintenance of a divorced wife under section 125 CrPC",
    citation: "(1985) 2 SCC 556",
    court: "Supreme Court of India",
    year: 1985,
    subject: "Family Law",
    brief: brief({
      caseName: "Mohd. Ahmed Khan v. Shah Bano Begum",
      citation: "(1985) 2 SCC 556",
      court: "Supreme Court of India",
      date: "23 April 1985",
      bench: "5-judge Constitution Bench (Chandrachud CJI presiding)",
      facts:
        "Shah Bano Begum, a divorced Muslim woman, claimed maintenance from her former husband under section 125 of the CrPC. The husband argued that Muslim personal law governed the parties, that maintenance was limited to the iddat period, and that the mahr he had paid discharged his obligation.",
      proceduralHistory:
        "The Magistrate awarded maintenance; the High Court enhanced it; the husband appealed to the Supreme Court.",
      issues: [
        "Does section 125 CrPC apply to a divorced Muslim woman?",
        "Is the husband's liability limited to the iddat period under personal law?",
        "Does payment of mahr discharge the obligation to maintain?",
      ],
      petitionerArguments:
        "Personal law governs maintenance; section 125 is a criminal provision that should not override it; mahr is a payment made in consideration of marriage and satisfies any claim.",
      respondentArguments:
        "Section 125 applies to all citizens irrespective of religion; its purpose is to prevent vagrancy and destitution; personal law cannot displace a statutory welfare provision.",
      statutes: ["Code of Criminal Procedure, 1973, s. 125", "Constitution of India, Arts. 15, 44"],
      precedents: ["Bai Tahira (1979)", "Fazlunbi (1980)"],
      reasoning:
        "The Court held that section 125 is a secular provision applicable to all citizens and is not displaced by personal law. A divorced wife who has not remarried and cannot maintain herself is entitled to maintenance beyond the iddat period. Mahr is not a substitute for maintenance. The Court also referred to Article 44 and the desirability of a uniform civil code, which became politically controversial.",
      decision:
        "The appeal was dismissed: section 125 applied to Shah Bano, and the husband was liable to pay maintenance beyond the iddat period. The Court upheld the High Court's order.",
      ratio: [
        "Section 125 CrPC applies to all citizens, including divorced Muslim women, and is not overridden by personal law.",
        "A divorced wife unable to maintain herself is entitled to maintenance beyond the iddat period.",
      ],
      obiter: [
        "The Court's observations on Article 44 and a uniform civil code were obiter and proved politically significant.",
      ],
      principles: [
        "Secular welfare legislation",
        "Maintenance as a social safety net",
        "Personal law and statutory rights",
      ],
      examSummary:
        "Shah Bano held that section 125 CrPC applies regardless of religion and allows maintenance beyond the iddat period. Its observations on a uniform civil code led to the 1986 Act, which now governs maintenance for divorced Muslim women. The case is central to discussions of personal law, gender justice and the DPSP in Article 44.",
      pointsToRemember: [
        "Section 125 is a secular, welfare-oriented provision.",
        "Mahr does not by itself discharge the maintenance obligation.",
        "The 1986 Act was Parliament's response to the judgment.",
        "The Article 44 observations were obiter.",
      ],
      thirtySecond:
        "Section 125 CrPC applies to all citizens, including divorced Muslim women. Shah Bano (1985) held that maintenance is not limited to the iddat period and that mahr does not discharge the obligation.",
      oneMinute:
        "Shah Bano, a divorced Muslim woman, sought maintenance under section 125 CrPC. Her husband argued that personal law and mahr extinguished the claim. A five-judge Bench held that section 125 is a secular provision applicable to all citizens, and that a divorced wife unable to maintain herself can claim maintenance beyond the iddat period. The judgment's observations on Article 44 triggered a political controversy and led to the 1986 Act, which now governs the field.",
      beginner:
        "Section 125 CrPC is a criminal procedure provision intended to stop people from becoming destitute. The Supreme Court said it applies to everyone, whatever their religion, so a divorced wife who cannot support herself can ask the court for maintenance. The case also sparked a national debate about personal law and whether India should have a uniform civil code.",
      examOutline: [
        "Facts and the statutory claim.",
        "Section 125 CrPC and its secular purpose.",
        "Personal law versus statutory welfare.",
        "Holding on iddat and mahr.",
        "Aftermath: the 1986 Act and its constitutional challenges.",
        "Article 44 debate and gender justice.",
      ],
    }),
  }),
];
