import type { CaseBrief, DocumentKind, DocumentMeta, Verification } from "./types";

export interface SeedDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  subtitle?: string;
  citation?: string;
  court?: string;
  year?: number;
  subject?: string;
  docType?: string;
  sourceUrl?: string;
  officialText?: string;
  explanation?: string;
  brief?: CaseBrief;
  meta?: DocumentMeta;
  verification: Verification;
}

const CONSTITUTION = "https://legislative.gov.in/constitution-of-india/";
const INDIA_CODE = "https://www.indiacode.nic.in/";

const VERIFY_BARE_ACT =
  "Section text reproduced for study. Check the current amended text on India Code before quoting it in an answer or memo.";

export const SEED_STATUTES: SeedDocument[] = [
  {
    id: "const-art-12",
    kind: "statute",
    title: "Article 12 — Definition of “the State”",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 12",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "limited-verification",
    officialText:
      "In this Part, unless the context otherwise requires, “the State” includes the Government and Parliament of India and the Government and the Legislature of each of the States and all local or other authorities within the territory of India or under the control of the Government of India.",
    explanation:
      "Article 12 fixes the class of bodies against whom fundamental rights can be enforced. Courts have read “other authorities” expansively to include statutory corporations and, through the instrumentality test, bodies that are financially, functionally and administratively dominated by the government. Purely private bodies generally fall outside Article 12, though writs may still lie under Article 226 where a public duty is involved.\n\nFor exams, pair Article 12 with Article 13 (laws inconsistent with fundamental rights) and Article 32 (the enforcement remedy). A useful exam move: identify the body, apply the instrumentality test, then ask whether the right in question binds private actors anyway (for example, Articles 15(2), 17 and 23).",
    meta: {
      tags: ["state action", "instrumentality test", "fundamental rights"],
      verificationNote: VERIFY_BARE_ACT,
    },
  },
  {
    id: "const-art-14",
    kind: "statute",
    title: "Article 14 — Equality before law",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 14",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "official-source",
    officialText:
      "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
    explanation:
      "Article 14 contains two ideas: equality before the law (the British negative concept, no special privileges) and equal protection of the laws (the American positive concept, like should be treated alike). It permits reasonable classification, tested by (i) intelligible differentia and (ii) a rational nexus with the object of the law.\n\nModern doctrine adds a second layer: classification that touches a fundamental right or an enumerated ground may need to satisfy proportionality and non-arbitrariness. Maneka Gandhi and E.P. Royappa give Article 14 its anti-arbitrariness dimension; Article 14 also protects against unequal treatment within a class and is not confined to citizens.",
    meta: { tags: ["equality", "reasonable classification", "arbitrariness"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "const-art-15",
    kind: "statute",
    title: "Article 15 — Prohibition of discrimination",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 15",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "limited-verification",
    officialText:
      "(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them.\n\n(2) No citizen shall, on grounds only of religion, race, caste, sex, place of birth or any of them, be subject to any disability, liability, restriction or condition with regard to— (a) access to shops, public restaurants, hotels and places of public entertainment; or (b) the use of wells, tanks, bathing ghats, roads and places of public resort maintained wholly or partly out of State funds or dedicated to the use of the general public.\n\n(3) Nothing in this article shall prevent the State from making any special provision for women and children.\n\n(4) Nothing in this article or in clause (2) of article 29 shall prevent the State from making any special provision for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes and the Scheduled Tribes.\n\n(5) Nothing in this article or in sub-clause (g) of clause (1) of article 19 shall prevent the State from making any special provision, by law, for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes or the Scheduled Tribes in so far as such special provisions relate to their admission to educational institutions including private educational institutions, whether aided or unaided by the State, other than the minority educational institutions referred to in clause (1) of article 30.",
    explanation:
      "Article 15 is the equality guarantee specific to citizens and to enumerated grounds. The word “only” matters: a policy that also rests on a non-prohibited ground is not automatically struck down, but a ground that is a proxy for caste, religion or sex will be examined closely.\n\nClauses (3)–(6) are enabling provisions, not exceptions in the ordinary sense: they let the State make special provision for women, children, backward classes, SCs, STs and EWS. Indra Sawhney (1992) read clause (4) as subject to the 50% ceiling and to the exclusion of the “creamy layer”. Janhit Abhiyan (2022) upheld the EWS reservation amendment.",
    meta: { tags: ["discrimination", "reservation", "special provision"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "const-art-19",
    kind: "statute",
    title: "Article 19 — Freedom of speech and expression",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 19(1)(a) and 19(2)",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "official-source",
    officialText:
      "(1) All citizens shall have the right— (a) to freedom of speech and expression; …\n\n(2) Nothing in sub-clause (a) of clause (1) shall affect the operation of any existing law, or prevent the State from making any law, in so far as such law imposes reasonable restrictions on the exercise of the right conferred by the said sub-clause in the interests of the sovereignty and integrity of India, the security of the State, friendly relations with foreign States, public order, decency or morality or in relation to contempt of court, defamation or incitement to an offence.",
    explanation:
      "Article 19(1)(a) protects the expression of ideas, including political speech, criticism of government, artistic expression and (through the right to information and the press) access to information. It is available only to citizens.\n\nRestrictions must fall within a clause (2) head and be reasonable in substance and procedure — proportionality applies. The Supreme Court has read down provisions that chill speech, and in Shreya Singhal (2015) struck down section 66A of the IT Act for vagueness and overbreadth. Note the special position of public servants under Article 33 and of contempt jurisdiction under Article 129/142.",
    meta: { tags: ["free speech", "reasonable restriction", "proportionality"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "const-art-21",
    kind: "statute",
    title: "Article 21 — Life and personal liberty",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 21",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "official-source",
    officialText:
      "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
    explanation:
      "Read literally, Article 21 is a procedural guarantee. Maneka Gandhi (1978) transformed it: the procedure must be fair, just and reasonable, and Article 21 cannot be read in isolation from Articles 14 and 19.\n\nThe article is now the source of unenumerated rights, including privacy (Puttaswamy, 2017), dignity, shelter, health, a clean environment, speedy trial, legal aid and the right to die with dignity in the limited sense of passive euthanasia (Common Cause, 2018). Deprivation must satisfy a legitimate State aim and proportionality, and any curtailment of liberty must have a legal basis that itself meets that standard.",
    meta: {
      tags: ["due process", "privacy", "dignity", "proportionality"],
      verificationNote: VERIFY_BARE_ACT,
    },
  },
  {
    id: "const-art-21a",
    kind: "statute",
    title: "Article 21A — Right to education",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 21A; RTE Act, 2009",
    year: 2002,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "official-source",
    officialText:
      "The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.",
    explanation:
      "Inserted by the 86th Amendment (2002), Article 21A converts the Unni Krishnan reading of Article 21 into an express fundamental right for children aged 6–14. The Right of Children to Free and Compulsory Education Act, 2009 supplies the machinery: no capitation fees, no screening, 25% seats for disadvantaged groups in private unaided schools, and minimum teacher and infrastructure norms.\n\nFor problem questions, check the child's age, the nature of the institution (minority institutions have special protection under Article 30), and whether the claim is about access, quality or discrimination.",
    meta: { tags: ["education", "RTE", "child rights"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "const-art-32",
    kind: "statute",
    title: "Article 32 — Writ jurisdiction of the Supreme Court",
    subtitle: "Constitution of India, Part III",
    citation: "Constitution of India, Art. 32",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "limited-verification",
    officialText:
      "(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.\n\n(2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.\n\n(3) Without prejudice to the powers conferred on the Supreme Court by clauses (1) and (2), Parliament may by law empower any other court to exercise within the local limits of its jurisdiction all or any of the powers exercisable by the Supreme Court under clause (2).\n\n(4) The right guaranteed by this article shall not be suspended except as otherwise provided for by this Constitution.",
    explanation:
      "Article 32 is itself a fundamental right — Dr Ambedkar called it the “heart and soul” of the Constitution. Five writs are available: habeas corpus (produce the body), mandamus (command a public duty), prohibition (stop an inferior court exceeding jurisdiction), certiorari (quash an order) and quo warranto (question authority to hold office).\n\nArticle 32 is narrower than Article 226: it lies only for fundamental rights, while a High Court may issue writs for other legal rights too. Public interest litigation relaxes standing but not the requirement of a fundamental right. Courts refuse relief where an alternative efficacious remedy exists, though that is a rule of practice, not jurisdiction.",
    meta: { tags: ["writs", "PIL", "enforcement"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "const-art-368",
    kind: "statute",
    title: "Article 368 — Power of Parliament to amend the Constitution",
    subtitle: "Constitution of India, Part XX",
    citation: "Constitution of India, Art. 368",
    year: 1950,
    subject: "Constitutional Law",
    docType: "Bare Act",
    sourceUrl: CONSTITUTION,
    verification: "limited-verification",
    officialText:
      "(1) Notwithstanding anything in this Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article.\n\n(2) An amendment of this Constitution may be initiated only by the introduction of a Bill for the purpose in either House of Parliament, and when the Bill is passed in each House by a majority of the total membership of that House and by a majority of not less than two-thirds of the members of that House present and voting, it shall be presented to the President who shall give his assent to the Bill and thereupon the Constitution shall stand amended…\n\nProvided that if such amendment seeks to make any change in [Articles 54, 55, 73, 162, 241, 279A, 280, 315–323, 330–342, 368, 369, 371A–371J, 372, 375, 376C–376E, 392 and the Seventh Schedule], the amendment shall also require to be ratified by the Legislatures of not less than one-half of the States…",
    explanation:
      "Article 368 sets out the amending procedure: a Bill in either House, a special majority in each House, and presidential assent, with State ratification for federal provisions. Kesavananda Bharati (1973) held that the amending power is wide but cannot destroy the basic structure of the Constitution.\n\nThe basic structure doctrine is judicially evolved, not textual. Its content is contested but typically includes supremacy of the Constitution, republican and democratic form of government, secularism, separation of powers, federalism and judicial review. Minerva Mills (1980) held that clauses (4) and (5) of Article 368 (inserted by the 42nd Amendment) were themselves unconstitutional because they excluded judicial review and made amendments immune from challenge.",
    meta: {
      tags: ["amendment", "basic structure", "constituent power"],
      verificationNote: "Clause (2) proviso is condensed; check the full list of Articles in the bare Act.",
    },
  },
  {
    id: "contract-s2h",
    kind: "statute",
    title: "Section 2(h) — Definition of contract",
    subtitle: "Indian Contract Act, 1872",
    citation: "Indian Contract Act, 1872, s. 2(h)",
    year: 1872,
    subject: "Contract Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "official-source",
    officialText: "An agreement enforceable by law is a contract.",
    explanation:
      "Section 2(h) is the doorway to the Act: contract = agreement + enforceability. Section 2(e) defines an agreement as every promise or set of promises forming the consideration for each other; section 2(b) defines a promise as a proposal when accepted.\n\nThe chain to remember in an exam is: proposal → acceptance → promise → consideration → agreement → enforceability → contract. Section 10 supplies the conditions of enforceability, and section 2(g) says an agreement not enforceable by law is void.",
    meta: { tags: ["definition", "agreement", "enforceability"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "contract-s10",
    kind: "statute",
    title: "Section 10 — What agreements are contracts",
    subtitle: "Indian Contract Act, 1872",
    citation: "Indian Contract Act, 1872, s. 10",
    year: 1872,
    subject: "Contract Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "official-source",
    officialText:
      "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.\n\nNothing herein contained shall affect any law in force in India, and not hereby expressly repealed, by which any contract is required to be made in writing or in the presence of witnesses, or any law relating to the registration of documents.",
    explanation:
      "Section 10 lists the essentials: free consent, competence (section 11), lawful consideration and object (section 23), and no express statutory bar (sections 24–30). The second paragraph preserves formalities required by other statutes — sale deeds, lease agreements and arbitration clauses may need writing or registration.\n\nA common exam trap: consideration need not be adequate (Explanation 2 to section 25), but it must be real and lawful. Natural love and affection can support a contract only within the narrow exception in section 25(1).",
    meta: { tags: ["essentials", "consideration", "free consent"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "contract-s23",
    kind: "statute",
    title: "Section 23 — Lawful object and consideration",
    subtitle: "Indian Contract Act, 1872",
    citation: "Indian Contract Act, 1872, s. 23",
    year: 1872,
    subject: "Contract Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "The consideration or object of an agreement is lawful, unless— it is forbidden by law; or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent; or involves or implies injury to the person or property of another; or the Court regards it as immoral, or opposed to public policy.\n\nIn each of these cases, the consideration or object of an agreement is said to be unlawful. Every agreement of which the object or consideration is unlawful is void.",
    explanation:
      "Section 23 is the public-policy gate. “Public policy” is not a free-standing licence to rewrite bargains: courts interfere only on recognised heads such as trading with the enemy, stifling prosecution, maintenance and champerty, marriage brokerage, and agreements to influence public appointments.\n\nThe consequences are in sections 24–30: if consideration is unlawful in part, the whole agreement is generally void; a collateral transaction may survive if it is separable. Compare section 23 with section 56 (frustration) — one asks whether the object was unlawful from the start, the other whether performance became impossible later.",
    meta: { tags: ["public policy", "unlawful object", "void agreements"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "contract-s56",
    kind: "statute",
    title: "Section 56 — Agreement to do impossible act",
    subtitle: "Indian Contract Act, 1872",
    citation: "Indian Contract Act, 1872, s. 56",
    year: 1872,
    subject: "Contract Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "official-source",
    officialText:
      "An agreement to do an act impossible in itself is void.\n\nContract to do act afterwards becoming impossible or unlawful.—A contract to do an act which, after the contract is made, becomes impossible, or, by reason of some event which the promisor could not prevent, unlawful, becomes void when the act becomes impossible or unlawful.\n\nCompensation for loss through non-performance of act known to be impossible or unlawful.—Where one person has promised to do something which he knew, or, with reasonable diligence, might have known, and which the promisee did not know, to be impossible or unlawful, such promisor must make compensation to such promisee for any loss which such promisee sustains through the non-performance of the promise.",
    explanation:
      "The doctrine of frustration discharges a contract when performance becomes impossible or unlawful without fault of either party. Indian courts apply it more readily than English courts apply the common law frustration doctrine, but the bar remains high: mere hardship, price rise or delay is not frustration.\n\nIllustrations include destruction of the subject matter, death or incapacity in personal contracts, and supervening illegality. Satyabrata Ghose (1954) held that section 56 is a positive rule of law, not merely an inference from the intention of the parties. Compare force majeure clauses, which allocate risk by agreement and may displace the statutory doctrine.",
    meta: { tags: ["frustration", "impossibility", "force majeure"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "contract-s73",
    kind: "statute",
    title: "Section 73 — Compensation for breach of contract",
    subtitle: "Indian Contract Act, 1872",
    citation: "Indian Contract Act, 1872, s. 73",
    year: 1872,
    subject: "Contract Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.\n\nSuch compensation is not to be given for any remote and indirect loss or damage sustained by reason of the breach.\n\n…Explanation.—In estimating the loss or damage arising from a breach of contract, the means which existed of remedying the inconvenience caused by the non-performance of the contract must be taken into account.",
    explanation:
      "Section 73 codifies Hadley v Baxendale: recover general losses arising naturally, and special losses within the parties' contemplation at formation. Remoteness, causation and mitigation limit the claim. Damages are compensatory, not punitive; exemplary damages are confined to breach of promise to marry and wrongful dishonour of cheques.\n\nThe section's measure is the loss actually suffered, not the gain the promisor made. For anticipatory breach, sections 39 and 73 together allow an immediate suit or waiting until performance falls due, subject to mitigation.",
    meta: { tags: ["damages", "remoteness", "mitigation"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "ipc-s300",
    kind: "statute",
    title: "Section 300 — Murder",
    subtitle: "Indian Penal Code, 1860 (now BNS, 2023)",
    citation: "Indian Penal Code, 1860, s. 300",
    year: 1860,
    subject: "Criminal Law",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "Except in the cases hereinafter excepted, culpable homicide is murder, if the act by which the death is caused is done with the intention of causing death, or—\n\nSecondly.—If it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person to whom the harm is caused, or—\n\nThirdly.—If it is done with the intention of causing bodily injury to any person and the bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death, or—\n\nFourthly.—If the person committing the act knows that it is so imminently dangerous that it must, in all probability, cause death or such bodily injury as is likely to cause death, and commits such act without any excuse for incurring the risk of causing death or such injury as aforesaid.",
    explanation:
      "Section 300 defines murder as a species of culpable homicide (section 299). The four clauses turn on intention and knowledge; clause three is the “sufficient in the ordinary course of nature” limb associated with Virsa Singh (1958).\n\nThe five exceptions reduce murder to culpable homicide not amounting to murder: grave and sudden provocation; exceeding the right of private defence in good faith; a public servant acting in good faith; a sudden fight without premeditation; and consent of the deceased (where the act is not itself murder). BNS, 2023 re-enacts the substance in sections 100–105 — see the mapping note in this library.",
    meta: {
      tags: ["murder", "culpable homicide", "exceptions"],
      verificationNote: "Official text condensed; the five exceptions are summarised in the study note.",
    },
  },
  {
    id: "ipc-s378",
    kind: "statute",
    title: "Section 378 — Theft",
    subtitle: "Indian Penal Code, 1860 (now BNS, 2023)",
    citation: "Indian Penal Code, 1860, s. 378",
    year: 1860,
    subject: "Criminal Law",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "official-source",
    officialText:
      "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
    explanation:
      "The ingredients of theft are: (1) a dishonest intention to take, (2) movable property, (3) out of the possession of another, (4) without consent, and (5) moving the property. “Dishonestly” is defined in section 24; “moving” is explained in the illustrations to section 378.\n\nKey distinctions: theft vs extortion (consent is obtained by threat in extortion); theft vs robbery (robbery is theft or extortion with force or fear); theft vs criminal breach of trust (possession is lawfully obtained in CBT). BNS, 2023 retains theft in section 303, with punishment provisions renumbered.",
    meta: { tags: ["theft", "dishonest intention", "movable property"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "ipc-s420",
    kind: "statute",
    title: "Section 420 — Cheating and dishonestly inducing delivery",
    subtitle: "Indian Penal Code, 1860 (now BNS, 2023)",
    citation: "Indian Penal Code, 1860, s. 415 and s. 420",
    year: 1860,
    subject: "Criminal Law",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "Section 415: Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to “cheat”.\n\nSection 420: Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    explanation:
      "Cheating requires deception, inducement, and damage or harm; section 420 adds dishonest inducement to deliver property. The deception must be of a fact and must precede the delivery — a broken promise made without a dishonest intention at the time is not cheating.\n\nCivil breach and criminal cheating overlap but are not identical; courts insist on a clear dishonest intention at the inception. For exam answers, distinguish section 415 (definition) from 417 (punishment) and 420 (aggravated form), and check whether the property was delivered because of the deception.",
    meta: { tags: ["cheating", "deception", "dishonest inducement"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "crpc-s154",
    kind: "statute",
    title: "Section 154 — Information in cognizable cases (FIR)",
    subtitle: "Code of Criminal Procedure, 1973 (now BNSS, 2023)",
    citation: "Code of Criminal Procedure, 1973, s. 154",
    year: 1973,
    subject: "Criminal Procedure",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "(1) Every information relating to the commission of a cognizable offence, irrespective of the area where the offence is committed, may be given orally or by electronic communication to an officer in charge of a police station, and if given orally, shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer in such form as the State Government may prescribe in this behalf.\n\n(3) Any person aggrieved by a refusal on the part of an officer in charge of a police station to record the information referred to in sub-section (1) may send the substance of such information, in writing and by post, to the Superintendent of Police…",
    explanation:
      "Section 154 is the statutory foundation of the First Information Report. Lalita Kumari (2013) held that registration is mandatory when information discloses a cognizable offence, with a limited preliminary inquiry only in the categories the Court identified. Delay in lodging an FIR is not fatal but must be explained; the FIR is not substantive evidence, though it can corroborate or contradict the informant under section 157 and section 145 of the Evidence Act.\n\nBNSS, 2023 re-enacts the provision as section 173 and permits electronic registration subject to signature within three days. Compare section 154 with section 162 (statements to police during investigation, not signed) and section 161.",
    meta: {
      tags: ["FIR", "cognizable offence", "Lalita Kumari"],
      verificationNote: "Sub-sections (2) and the proviso are omitted here; read the full section in the bare Act.",
    },
  },
  {
    id: "crpc-s41",
    kind: "statute",
    title: "Section 41 — When police may arrest without warrant",
    subtitle: "Code of Criminal Procedure, 1973 (now BNSS, 2023)",
    citation: "Code of Criminal Procedure, 1973, s. 41",
    year: 1973,
    subject: "Criminal Procedure",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "(1) Any police officer may without an order from a Magistrate and without a warrant, arrest any person—\n\n(a) who has been concerned in any cognizable offence, or against whom a reasonable complaint has been made, or credible information has been received, or a reasonable suspicion exists, of his having been so concerned; or\n\n(b) who has in his possession without lawful excuse, the burden of proving which excuse shall lie on such person, any implement of house-breaking; or …\n\n(2) Where a police officer is empowered to arrest without warrant, he shall, in each case, satisfy himself that the arrest is necessary — to prevent the person from committing a further offence, for a proper investigation, to prevent tampering with evidence, or to secure his presence in court.",
    explanation:
      "Section 41 was amended in 2008–2010 to introduce the necessity test in clause (2) and the notice of appearance procedure in section 41A. Arnesh Kumar (2014) directed police not to arrest mechanically in offences punishable up to seven years and required magistrate scrutiny before authorising detention.\n\nThe Supreme Court has repeatedly emphasised that arrest is not punishment. For problem questions, consider sections 41, 41A, 41B (arrest memo and witness), 46 (how arrest is made), 50 (grounds), 50A (information to a nominated person), 54 (medical examination), 55A (health and safety of arrested person) and Article 22(1)–(2).",
    meta: {
      tags: ["arrest", "necessity test", "Arnesh Kumar"],
      verificationNote: "Only clauses (1)(a)–(b) and the 2010 necessity test are reproduced; see the bare Act for the full list.",
    },
  },
  {
    id: "evidence-s45",
    kind: "statute",
    title: "Section 45 — Opinions of experts",
    subtitle: "Indian Evidence Act, 1872 (now BSA, 2023)",
    citation: "Indian Evidence Act, 1872, s. 45",
    year: 1872,
    subject: "Law of Evidence",
    docType: "Bare Act (repealed)",
    sourceUrl: INDIA_CODE,
    verification: "official-source",
    officialText:
      "When the Court has to form an opinion upon a point of foreign law, or of science, or art, or as to identity of handwriting or finger impressions, the opinions upon that point of persons specially skilled in such foreign law, science or art, or in questions as to identity of handwriting or finger impressions, are relevant facts. Such persons are called experts.",
    explanation:
      "Expert evidence is relevant but not conclusive: the court decides the issue, and the expert's opinion must be tested by cross-examination and by the reasons given. Section 45 covers foreign law, science, art and identification of handwriting and finger impressions; the list is illustrative, and courts admit other specialised fields (ballistics, DNA, accounting) under the same principle.\n\nSection 45A deals with the opinion of the Examiner of Electronic Evidence. For digital evidence, section 65B (now section 63 of the BSA) supplies the admissibility certificate route; Arjun Panditrao Khotkar (2020) settled that a certificate is mandatory for secondary electronic evidence.",
    meta: { tags: ["expert evidence", "opinion", "digital evidence"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "hma-s5",
    kind: "statute",
    title: "Section 5 — Conditions for a Hindu marriage",
    subtitle: "Hindu Marriage Act, 1955",
    citation: "Hindu Marriage Act, 1955, s. 5",
    year: 1955,
    subject: "Family Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "A marriage may be solemnized between any two Hindus, if the following conditions are fulfilled, namely:—\n\n(i) neither party has a spouse living at the time of the marriage;\n\n(ii) at the time of the marriage, neither party— (a) is incapable of giving a valid consent to it in consequence of unsoundness of mind; or (b) though capable of giving a valid consent, has been suffering from mental disorder of such a kind or to such an extent as to be unfit for marriage and the procreation of children; or (c) has been subject to recurrent attacks of insanity;\n\n(iii) the bridegroom has completed the age of twenty-one years and the bride the age of eighteen years at the time of the marriage;\n\n(iv) the parties are not within the degrees of prohibited relationship, unless the custom or usage governing each of them permits of a marriage between the two;\n\n(v) the parties are not sapindas of each other, unless the custom or usage governing each of them permits of a marriage between the two.",
    explanation:
      "Section 5 sets out the five conditions of a valid Hindu marriage. Breach of clauses (i), (iv) or (v) makes the marriage void under section 11; breach of clause (ii) makes it voidable under section 12; breach of the age condition in clause (iii) attracts the penalties in section 18 and the Child Marriage Restraint Act, but does not by itself make the marriage void.\n\nThe section applies to Hindus by religion in any form, including Virashaivas, Lingayats, followers of Brahmo, Prarthana and Arya Samaj, and to Jains, Buddhists and Sikhs. The Special Marriage Act, 1954 provides a civil alternative; the Prohibition of Child Marriage Act, 2006 operates alongside the penal provisions.",
    meta: { tags: ["valid marriage", "void", "voidable", "sapinda"], verificationNote: VERIFY_BARE_ACT },
  },
  {
    id: "hma-s13",
    kind: "statute",
    title: "Section 13 — Divorce",
    subtitle: "Hindu Marriage Act, 1955",
    citation: "Hindu Marriage Act, 1955, s. 13",
    year: 1955,
    subject: "Family Law",
    docType: "Bare Act",
    sourceUrl: INDIA_CODE,
    verification: "limited-verification",
    officialText:
      "(1) Any marriage solemnized, whether before or after the commencement of this Act, may, on a petition presented by either the husband or the wife, be dissolved by a decree of divorce on the ground that the other party—\n\n(i) has, after the solemnization of the marriage, had voluntary sexual intercourse with any person other than his or her spouse; or\n\n(ia) has, after the solemnization of the marriage, treated the petitioner with cruelty; or\n\n(ib) has deserted the petitioner for a continuous period of not less than two years immediately preceding the presentation of the petition; or\n\n(ic) has been suffering from mental disorder…; or\n\n(id) has been suffering from a virulent and incurable form of leprosy; or\n\n(ie) has been suffering from venereal disease in a communicable form; or\n\n(if) has renounced the world by entering any religious order; or\n\n(ig) has not been heard of as being alive for a period of seven years or more…",
    explanation:
      "Section 13(1) lists fault grounds available to either spouse; section 13(2) adds special grounds for the wife (rape, sodomy, bestiality; non-resumption of cohabitation after a maintenance order; option of puberty). Section 13B provides divorce by mutual consent, with the statutory waiting period and the court's discretion in waiving it.\n\nCruelty under clause (ia) includes mental cruelty; the standard is objective but assessed in the context of the parties' social milieu. Desertion requires factum and animus deserendi for two years. Section 23 bars relief where the petitioner has condoned the act, taken advantage of it, or is guilty of unnecessary delay; section 23(2) mandates reconciliation efforts.",
    meta: {
      tags: ["divorce", "cruelty", "desertion", "mutual consent"],
      verificationNote: "Grounds (ic)–(ig) are condensed. Read the full section for the current list.",
    },
  },
  {
    id: "bns-mapping-100",
    kind: "statute",
    title: "BNS 2023, ss. 100–105 — Murder and culpable homicide (mapping note)",
    subtitle: "Bharatiya Nyaya Sanhita, 2023",
    citation: "Bharatiya Nyaya Sanhita, 2023, ss. 100–105",
    year: 2023,
    subject: "Criminal Law",
    docType: "Code (mapping note)",
    sourceUrl: INDIA_CODE,
    verification: "unverified",
    officialText: undefined,
    explanation:
      "The Bharatiya Nyaya Sanhita, 2023 replaced the Indian Penal Code from 1 July 2024. The homicide provisions are renumbered rather than redesigned: BNS section 100 corresponds to IPC section 300 (murder), section 101 to IPC 301 (causing death by a person other than the person whose act caused it), section 103 to IPC 302 (punishment for murder), section 104 to IPC 304 (culpable homicide not amounting to murder) and section 105 to IPC 304A (death by negligence).\n\nDo not rely on the numbers alone: read the BNS text itself. For exams, cite the provision in force at the time of the offence, and mention both numbering schemes where the facts span the transition. This record is a mapping aid, not the official text.",
    meta: {
      tags: ["BNS", "IPC", "mapping", "murder"],
      verificationNote:
        "Mapping accuracy is not guaranteed. Check the BNS, 2023 and the official IPC–BNS correspondence table before citing.",
    },
  },
  {
    id: "bns-mapping-303",
    kind: "statute",
    title: "BNS 2023, ss. 303–318 — Theft, cheating and property offences (mapping note)",
    subtitle: "Bharatiya Nyaya Sanhita, 2023",
    citation: "Bharatiya Nyaya Sanhita, 2023, ss. 303, 318",
    year: 2023,
    subject: "Criminal Law",
    docType: "Code (mapping note)",
    sourceUrl: INDIA_CODE,
    verification: "unverified",
    officialText: undefined,
    explanation:
      "Property offences in the BNS broadly track the IPC: section 303 covers theft (IPC 378–379), section 304 extortion, section 305 criminal breach of trust, section 316 criminal breach of trust by public servants, bankers and agents, and section 318 covers cheating (IPC 415–420). The BNS inserts some new offences and reorganises punishments, so always read the current text.\n\nFor problem answers, identify the offence, the section in force on the date of the act, and the punishment; then test the specific ingredients (dishonest intention, deception, entrustment, delivery of property).",
    meta: {
      tags: ["BNS", "theft", "cheating", "mapping"],
      verificationNote:
        "Mapping accuracy is not guaranteed. Verify against the BNS, 2023 and its official correspondence table.",
    },
  },
  {
    id: "bnss-mapping-173",
    kind: "statute",
    title: "BNSS 2023, ss. 35, 173, 480 — Arrest, FIR and bail (mapping note)",
    subtitle: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    citation: "Bharatiya Nagarik Suraksha Sanhita, 2023, ss. 35, 173, 480",
    year: 2023,
    subject: "Criminal Procedure",
    docType: "Code (mapping note)",
    sourceUrl: INDIA_CODE,
    verification: "unverified",
    officialText: undefined,
    explanation:
      "The BNSS, 2023 replaces the CrPC. Section 35 corresponds to CrPC section 41 (arrest without warrant), section 173 to CrPC section 154 (FIR, now expressly permitting electronic information), section 187 to CrPC section 167 (remand), and section 480 to CrPC section 437 (bail in non-bailable offences).\n\nSeveral procedural changes matter for exams: electronic FIR registration with signature within three days, mandatory audio-video recording of search and seizure, timelines for investigation in certain offences, and a broader scheme for bail. Treat this as a pointer; the official BNSS text governs.",
    meta: {
      tags: ["BNSS", "CrPC", "FIR", "bail"],
      verificationNote:
        "Mapping accuracy is not guaranteed. Verify section numbers and wording against the BNSS, 2023.",
    },
  },
];

export const SEED_NOTES: SeedDocument[] = [
  {
    id: "note-case-brief-method",
    kind: "note",
    title: "How to brief a case so it actually helps in an exam",
    subtitle: "Study method · original note",
    subject: "Legal Method",
    docType: "Student note",
    year: 2026,
    verification: "ai-generated",
    explanation:
      "A case brief is a tool for recall, not a book report. The eight-line method: (1) identity — party names, court, year, citation; (2) facts in four sentences, only those the holding depends on; (3) the procedural journey — who won below and why it reached this court; (4) the question(s) the court had to answer; (5) the holding, stated as an answer to each question; (6) the ratio — the rule necessary to the decision; (7) the reasoning — how the court got there, including the provisions construed; (8) the residue — obiter, dissents, and what the case does not decide.\n\nWrite the ratio in your own words and then check it against the headnote. If your sentence needs the word “probably”, you have not found the ratio. For Indian judgments, note the Bench strength: a five-judge Constitution Bench carries more weight than a two-judge bench, and a later coordinate bench cannot overrule it.\n\nKeep a one-line “why it matters” at the top of every brief. In the exam, that line is your topic sentence; the rest is support.",
    meta: { tags: ["method", "case brief", "exams"], verificationNote: "Original study note written for Vidhi." },
  },
  {
    id: "note-reading-statute",
    kind: "note",
    title: "Reading a statute without a commentary",
    subtitle: "Study method · original note",
    subject: "Legal Method",
    docType: "Student note",
    year: 2026,
    verification: "ai-generated",
    explanation:
      "Start with the long title, the preamble and the definitions section, in that order. Definitions tell you which words are terms of art; the preamble tells you the mischief the Act addresses. Then read the operative provision and map its ingredients as a checklist: every “whoever”, “shall”, “with intent to” and proviso is a separate element that the prosecution or plaintiff must establish.\n\nUse the provisos and exceptions as a second column. An exam answer that states the rule but ignores the exception is half an answer. Then locate the penalty or remedy section — the consequence often reveals how the legislature understood the wrong.\n\nFinally, read the amendment history. A section that has been amended twice usually has a story, and that story is a favourite fact pattern. Cross-check the current text on India Code; commentaries are useful for argument, not for the words of the section.",
    meta: {
      tags: ["method", "statutory interpretation", "exams"],
      verificationNote: "Original study note written for Vidhi.",
    },
  },
];
