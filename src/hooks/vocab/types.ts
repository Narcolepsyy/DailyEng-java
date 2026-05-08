// ─── Shared types for vocab hooks ────────────────────

export interface VocabTopic {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  subcategory: string | null;
  wordCount: number;
  estimatedTime: number;
  progress?: number;
  thumbnail?: string | null;
}

export interface DictionaryWord {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  partOfSpeech: string;
  level: string;
}

export type TabType = "topics" | "bookmarks" | "dictionary";

// ─── Constants ─────────────────────────────────────

export const TOPICS_PER_PAGE = 12;
export const DICT_ITEMS_PER_PAGE = 50;

export const VOCAB_TABS = [
  { id: "topics", label: "Available Topics" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "dictionary", label: "Dictionary" },
] as const;

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// ─── Mock Dictionary Data ──────────────────────────

export const MOCK_DICTIONARY_WORDS: DictionaryWord[] = [
  // A
  { id: "1", word: "Abandon", pronunciation: "/əˈbændən/", meaning: "To leave behind or give up completely", partOfSpeech: "Verb", level: "B1" },
  { id: "2", word: "Accomplish", pronunciation: "/əˈkʌmplɪʃ/", meaning: "To complete or achieve something successfully", partOfSpeech: "Verb", level: "B1" },
  { id: "3", word: "Adequate", pronunciation: "/ˈædɪkwət/", meaning: "Sufficient for a specific requirement", partOfSpeech: "Adjective", level: "B2" },
  { id: "4", word: "Adventure", pronunciation: "/ədˈventʃər/", meaning: "An exciting or unusual experience", partOfSpeech: "Noun", level: "A2" },
  { id: "5", word: "Affordable", pronunciation: "/əˈfɔːdəbl/", meaning: "Inexpensive; reasonably priced", partOfSpeech: "Adjective", level: "B1" },
  // B
  { id: "6", word: "Benefit", pronunciation: "/ˈbenɪfɪt/", meaning: "An advantage or profit gained from something", partOfSpeech: "Noun", level: "A2" },
  { id: "7", word: "Brilliant", pronunciation: "/ˈbrɪliənt/", meaning: "Exceptionally clever or talented", partOfSpeech: "Adjective", level: "B1" },
  { id: "8", word: "Bureaucracy", pronunciation: "/bjʊəˈrɒkrəsi/", meaning: "A system of government with many complicated rules", partOfSpeech: "Noun", level: "C1" },
  { id: "9", word: "Beautiful", pronunciation: "/ˈbjuːtɪfl/", meaning: "Pleasing the senses or mind aesthetically", partOfSpeech: "Adjective", level: "A1" },
  { id: "10", word: "Brave", pronunciation: "/breɪv/", meaning: "Ready to face danger or pain", partOfSpeech: "Adjective", level: "A2" },
  // C
  { id: "11", word: "Collaborate", pronunciation: "/kəˈlæbəreɪt/", meaning: "To work together with others on a project", partOfSpeech: "Verb", level: "B2" },
  { id: "12", word: "Comprehensive", pronunciation: "/ˌkɒmprɪˈhensɪv/", meaning: "Including all or nearly all elements or aspects", partOfSpeech: "Adjective", level: "B2" },
  { id: "13", word: "Consequence", pronunciation: "/ˈkɒnsɪkwəns/", meaning: "A result or effect of an action", partOfSpeech: "Noun", level: "B1" },
  { id: "14", word: "Curious", pronunciation: "/ˈkjʊəriəs/", meaning: "Eager to know or learn something", partOfSpeech: "Adjective", level: "A2" },
  { id: "15", word: "Catastrophe", pronunciation: "/kəˈtæstrəfi/", meaning: "A sudden disaster causing great damage", partOfSpeech: "Noun", level: "C1" },
  // D
  { id: "16", word: "Determine", pronunciation: "/dɪˈtɜːmɪn/", meaning: "To decide or establish something precisely", partOfSpeech: "Verb", level: "B1" },
  { id: "17", word: "Diligent", pronunciation: "/ˈdɪlɪdʒənt/", meaning: "Having or showing care in one's work", partOfSpeech: "Adjective", level: "B2" },
  { id: "18", word: "Diverse", pronunciation: "/daɪˈvɜːs/", meaning: "Showing a great deal of variety", partOfSpeech: "Adjective", level: "B2" },
  { id: "19", word: "Delicious", pronunciation: "/dɪˈlɪʃəs/", meaning: "Highly pleasant to the taste", partOfSpeech: "Adjective", level: "A1" },
  { id: "20", word: "Demonstrate", pronunciation: "/ˈdemənstreɪt/", meaning: "To show or prove something clearly", partOfSpeech: "Verb", level: "B1" },
  // E
  { id: "21", word: "Efficient", pronunciation: "/ɪˈfɪʃnt/", meaning: "Working in a well-organized and competent way", partOfSpeech: "Adjective", level: "B2" },
  { id: "22", word: "Elaborate", pronunciation: "/ɪˈlæbərət/", meaning: "Involving many carefully arranged parts", partOfSpeech: "Adjective", level: "C1" },
  { id: "23", word: "Enthusiastic", pronunciation: "/ɪnˌθjuːziˈæstɪk/", meaning: "Having intense and eager enjoyment", partOfSpeech: "Adjective", level: "B1" },
  { id: "24", word: "Essential", pronunciation: "/ɪˈsenʃl/", meaning: "Absolutely necessary; extremely important", partOfSpeech: "Adjective", level: "B1" },
  { id: "25", word: "Exciting", pronunciation: "/ɪkˈsaɪtɪŋ/", meaning: "Causing great enthusiasm and eagerness", partOfSpeech: "Adjective", level: "A1" },
  // F
  { id: "26", word: "Family", pronunciation: "/ˈfæmɪli/", meaning: "A group of people related by blood or marriage", partOfSpeech: "Noun", level: "A1" },
  { id: "27", word: "Fascinating", pronunciation: "/ˈfæsɪneɪtɪŋ/", meaning: "Extremely interesting", partOfSpeech: "Adjective", level: "B1" },
  { id: "28", word: "Flexible", pronunciation: "/ˈfleksəbl/", meaning: "Able to be easily modified", partOfSpeech: "Adjective", level: "B1" },
  { id: "29", word: "Fluent", pronunciation: "/ˈfluːənt/", meaning: "Able to express oneself easily and articulately", partOfSpeech: "Adjective", level: "B2" },
  { id: "30", word: "Fundamental", pronunciation: "/ˌfʌndəˈmentl/", meaning: "Forming a necessary base or core", partOfSpeech: "Adjective", level: "B2" },
  // G
  { id: "31", word: "Generate", pronunciation: "/ˈdʒenəreɪt/", meaning: "To produce or create something", partOfSpeech: "Verb", level: "B2" },
  { id: "32", word: "Genuine", pronunciation: "/ˈdʒenjuɪn/", meaning: "Truly what something is said to be; authentic", partOfSpeech: "Adjective", level: "B1" },
  { id: "33", word: "Grateful", pronunciation: "/ˈɡreɪtfl/", meaning: "Feeling or showing thanks", partOfSpeech: "Adjective", level: "A2" },
  { id: "34", word: "Gorgeous", pronunciation: "/ˈɡɔːdʒəs/", meaning: "Beautiful; very attractive", partOfSpeech: "Adjective", level: "B1" },
  { id: "35", word: "Guarantee", pronunciation: "/ˌɡærənˈtiː/", meaning: "A formal promise or assurance", partOfSpeech: "Noun", level: "B1" },
  // H
  { id: "36", word: "Hypothesis", pronunciation: "/haɪˈpɒθəsɪs/", meaning: "A proposed explanation for a phenomenon", partOfSpeech: "Noun", level: "C1" },
  { id: "37", word: "Hesitate", pronunciation: "/ˈhezɪteɪt/", meaning: "To pause before saying or doing something", partOfSpeech: "Verb", level: "B1" },
  { id: "38", word: "Humble", pronunciation: "/ˈhʌmbl/", meaning: "Having a modest view of one's importance", partOfSpeech: "Adjective", level: "B2" },
  { id: "39", word: "Happy", pronunciation: "/ˈhæpi/", meaning: "Feeling or showing pleasure", partOfSpeech: "Adjective", level: "A1" },
  { id: "40", word: "Harmony", pronunciation: "/ˈhɑːməni/", meaning: "Agreement or concord", partOfSpeech: "Noun", level: "B2" },
  // I
  { id: "41", word: "Implement", pronunciation: "/ˈɪmplɪment/", meaning: "To put a plan or decision into effect", partOfSpeech: "Verb", level: "B2" },
  { id: "42", word: "Inevitable", pronunciation: "/ɪnˈevɪtəbl/", meaning: "Certain to happen; unavoidable", partOfSpeech: "Adjective", level: "B2" },
  { id: "43", word: "Innovative", pronunciation: "/ˈɪnəvətɪv/", meaning: "Introducing new ideas; original", partOfSpeech: "Adjective", level: "B2" },
  { id: "44", word: "Interesting", pronunciation: "/ˈɪntrəstɪŋ/", meaning: "Arousing curiosity or attention", partOfSpeech: "Adjective", level: "A1" },
  { id: "45", word: "Intuitive", pronunciation: "/ɪnˈtjuːɪtɪv/", meaning: "Using or based on what one feels is true", partOfSpeech: "Adjective", level: "C1" },
  // J
  { id: "46", word: "Justify", pronunciation: "/ˈdʒʌstɪfaɪ/", meaning: "To show or prove to be right or reasonable", partOfSpeech: "Verb", level: "B2" },
  { id: "47", word: "Journey", pronunciation: "/ˈdʒɜːni/", meaning: "An act of traveling from one place to another", partOfSpeech: "Noun", level: "A2" },
  { id: "48", word: "Joyful", pronunciation: "/ˈdʒɔɪfl/", meaning: "Feeling or causing great pleasure", partOfSpeech: "Adjective", level: "B1" },
  { id: "49", word: "Judge", pronunciation: "/dʒʌdʒ/", meaning: "To form an opinion or conclusion about", partOfSpeech: "Verb", level: "A2" },
  // K
  { id: "50", word: "Knowledge", pronunciation: "/ˈnɒlɪdʒ/", meaning: "Facts, information, and skills acquired", partOfSpeech: "Noun", level: "A2" },
  { id: "51", word: "Keen", pronunciation: "/kiːn/", meaning: "Having or showing eagerness", partOfSpeech: "Adjective", level: "B1" },
  { id: "52", word: "Kind", pronunciation: "/kaɪnd/", meaning: "Having a friendly, generous nature", partOfSpeech: "Adjective", level: "A1" },
  // L
  { id: "53", word: "Legacy", pronunciation: "/ˈleɡəsi/", meaning: "Something handed down from the past", partOfSpeech: "Noun", level: "C1" },
  { id: "54", word: "Legitimate", pronunciation: "/lɪˈdʒɪtɪmət/", meaning: "Conforming to the law or rules", partOfSpeech: "Adjective", level: "B2" },
  { id: "55", word: "Logical", pronunciation: "/ˈlɒdʒɪkl/", meaning: "Characterized by clear reasoning", partOfSpeech: "Adjective", level: "B1" },
  { id: "56", word: "Lovely", pronunciation: "/ˈlʌvli/", meaning: "Exquisitely beautiful", partOfSpeech: "Adjective", level: "A2" },
  // M
  { id: "57", word: "Magnificent", pronunciation: "/mæɡˈnɪfɪsnt/", meaning: "Impressively beautiful, elaborate, or extravagant", partOfSpeech: "Adjective", level: "B2" },
  { id: "58", word: "Maintain", pronunciation: "/meɪnˈteɪn/", meaning: "To cause or enable to continue", partOfSpeech: "Verb", level: "B1" },
  { id: "59", word: "Meticulous", pronunciation: "/məˈtɪkjələs/", meaning: "Showing great attention to detail", partOfSpeech: "Adjective", level: "C1" },
  { id: "60", word: "Modest", pronunciation: "/ˈmɒdɪst/", meaning: "Unassuming in estimation of one's abilities", partOfSpeech: "Adjective", level: "B1" },
  // N
  { id: "61", word: "Navigate", pronunciation: "/ˈnævɪɡeɪt/", meaning: "To plan and direct the route of a journey", partOfSpeech: "Verb", level: "B1" },
  { id: "62", word: "Negotiate", pronunciation: "/nɪˈɡəʊʃieɪt/", meaning: "To obtain or bring about by discussion", partOfSpeech: "Verb", level: "B2" },
  { id: "63", word: "Notorious", pronunciation: "/nəʊˈtɔːriəs/", meaning: "Famous for some bad quality", partOfSpeech: "Adjective", level: "C1" },
  { id: "64", word: "Nice", pronunciation: "/naɪs/", meaning: "Giving pleasure or satisfaction", partOfSpeech: "Adjective", level: "A1" },
  // O
  { id: "65", word: "Objective", pronunciation: "/əbˈdʒektɪv/", meaning: "Not influenced by personal feelings", partOfSpeech: "Adjective", level: "B2" },
  { id: "66", word: "Obtain", pronunciation: "/əbˈteɪn/", meaning: "To get or acquire", partOfSpeech: "Verb", level: "B1" },
  { id: "67", word: "Obvious", pronunciation: "/ˈɒbviəs/", meaning: "Easily perceived or understood", partOfSpeech: "Adjective", level: "B1" },
  { id: "68", word: "Optimistic", pronunciation: "/ˌɒptɪˈmɪstɪk/", meaning: "Hopeful and confident about the future", partOfSpeech: "Adjective", level: "B1" },
  // P
  { id: "69", word: "Paradox", pronunciation: "/ˈpærədɒks/", meaning: "A seemingly absurd statement that may be true", partOfSpeech: "Noun", level: "C1" },
  { id: "70", word: "Peculiar", pronunciation: "/pɪˈkjuːliər/", meaning: "Strange or unusual", partOfSpeech: "Adjective", level: "B2" },
  { id: "71", word: "Persistent", pronunciation: "/pəˈsɪstənt/", meaning: "Continuing firmly despite opposition", partOfSpeech: "Adjective", level: "B2" },
  { id: "72", word: "Pleasant", pronunciation: "/ˈpleznt/", meaning: "Giving a sense of happy satisfaction", partOfSpeech: "Adjective", level: "A2" },
  { id: "73", word: "Profound", pronunciation: "/prəˈfaʊnd/", meaning: "Very great or intense", partOfSpeech: "Adjective", level: "C1" },
  // Q
  { id: "74", word: "Qualified", pronunciation: "/ˈkwɒlɪfaɪd/", meaning: "Officially recognized as competent", partOfSpeech: "Adjective", level: "B1" },
  { id: "75", word: "Quiet", pronunciation: "/ˈkwaɪət/", meaning: "Making little or no noise", partOfSpeech: "Adjective", level: "A1" },
  { id: "76", word: "Quintessential", pronunciation: "/ˌkwɪntɪˈsenʃl/", meaning: "Representing the most perfect example", partOfSpeech: "Adjective", level: "C2" },
  // R
  { id: "77", word: "Rational", pronunciation: "/ˈræʃənl/", meaning: "Based on reason rather than emotions", partOfSpeech: "Adjective", level: "B2" },
  { id: "78", word: "Reliable", pronunciation: "/rɪˈlaɪəbl/", meaning: "Consistently good in quality", partOfSpeech: "Adjective", level: "B1" },
  { id: "79", word: "Remarkable", pronunciation: "/rɪˈmɑːkəbl/", meaning: "Worthy of attention; striking", partOfSpeech: "Adjective", level: "B1" },
  { id: "80", word: "Resilient", pronunciation: "/rɪˈzɪliənt/", meaning: "Able to recover quickly from difficulties", partOfSpeech: "Adjective", level: "C1" },
  // S
  { id: "81", word: "Significant", pronunciation: "/sɪɡˈnɪfɪkənt/", meaning: "Sufficiently great or important", partOfSpeech: "Adjective", level: "B1" },
  { id: "82", word: "Sophisticated", pronunciation: "/səˈfɪstɪkeɪtɪd/", meaning: "Having worldly knowledge and refinement", partOfSpeech: "Adjective", level: "B2" },
  { id: "83", word: "Spontaneous", pronunciation: "/spɒnˈteɪniəs/", meaning: "Performed without premeditation", partOfSpeech: "Adjective", level: "B2" },
  { id: "84", word: "Subtle", pronunciation: "/ˈsʌtl/", meaning: "Delicate or precise; not obvious", partOfSpeech: "Adjective", level: "B2" },
  { id: "85", word: "Simple", pronunciation: "/ˈsɪmpl/", meaning: "Easily done or understood", partOfSpeech: "Adjective", level: "A1" },
  // T
  { id: "86", word: "Thorough", pronunciation: "/ˈθʌrə/", meaning: "Complete with attention to every detail", partOfSpeech: "Adjective", level: "B2" },
  { id: "87", word: "Tolerant", pronunciation: "/ˈtɒlərənt/", meaning: "Willing to accept views different from one's own", partOfSpeech: "Adjective", level: "B2" },
  { id: "88", word: "Transparent", pronunciation: "/trænsˈpærənt/", meaning: "Easy to perceive or detect; clear", partOfSpeech: "Adjective", level: "B2" },
  { id: "89", word: "Tremendous", pronunciation: "/trəˈmendəs/", meaning: "Very great in amount or intensity", partOfSpeech: "Adjective", level: "B1" },
  // U
  { id: "90", word: "Ultimate", pronunciation: "/ˈʌltɪmət/", meaning: "Being the best or most extreme example", partOfSpeech: "Adjective", level: "B1" },
  { id: "91", word: "Unique", pronunciation: "/juːˈniːk/", meaning: "Being the only one of its kind", partOfSpeech: "Adjective", level: "A2" },
  { id: "92", word: "Unprecedented", pronunciation: "/ʌnˈpresɪdentɪd/", meaning: "Never done or known before", partOfSpeech: "Adjective", level: "C1" },
  { id: "93", word: "Useful", pronunciation: "/ˈjuːsfl/", meaning: "Able to be used for a practical purpose", partOfSpeech: "Adjective", level: "A1" },
  // V
  { id: "94", word: "Valuable", pronunciation: "/ˈvæljuəbl/", meaning: "Worth a great deal of money or importance", partOfSpeech: "Adjective", level: "B1" },
  { id: "95", word: "Versatile", pronunciation: "/ˈvɜːsətaɪl/", meaning: "Able to adapt to many functions", partOfSpeech: "Adjective", level: "B2" },
  { id: "96", word: "Vivid", pronunciation: "/ˈvɪvɪd/", meaning: "Producing strong clear images in the mind", partOfSpeech: "Adjective", level: "B2" },
  // W
  { id: "97", word: "Wonderful", pronunciation: "/ˈwʌndərfl/", meaning: "Inspiring delight or admiration", partOfSpeech: "Adjective", level: "A1" },
  { id: "98", word: "Worthwhile", pronunciation: "/ˌwɜːθˈwaɪl/", meaning: "Worth the time or effort spent", partOfSpeech: "Adjective", level: "B1" },
  // X
  { id: "99", word: "Xenophobia", pronunciation: "/ˌzenəˈfəʊbiə/", meaning: "Dislike or prejudice against foreigners", partOfSpeech: "Noun", level: "C2" },
  // Y
  { id: "100", word: "Yield", pronunciation: "/jiːld/", meaning: "To produce or provide; to give way", partOfSpeech: "Verb", level: "B2" },
  // Z
  { id: "101", word: "Zealous", pronunciation: "/ˈzeləs/", meaning: "Having great energy for a cause", partOfSpeech: "Adjective", level: "C1" },
];


