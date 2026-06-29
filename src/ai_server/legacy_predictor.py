import math
import bisect

try:
    import enchant
    _dict = enchant.Dict("en-US")
except Exception:
    _dict = None

try:
    from wordfreq import top_n_list, zipf_frequency
except Exception:
    top_n_list = None
    zipf_frequency = None

# Topic-based vocabulary for sign language recognition
# Organized by categories for diverse word suggestions

COMMON_WORDS = [
    # Pronouns & Personal
    "i", "you", "he", "she", "we", "they", "it", "me", "my", "your", "our", "their",
    "myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves",
    "this", "that", "these", "those", "who", "whom", "whose", "which", "what",

    # Be verbs & Auxiliary
    "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "done",
    "can", "could", "will", "would", "should", "may", "might", "must", "shall",

    # Common verbs
    "go", "come", "walk", "run", "stop", "wait", "stay", "leave", "arrive", "enter", "exit",
    "eat", "drink", "sleep", "wake", "rest", "work", "study", "learn", "teach", "read", "write",
    "speak", "talk", "say", "tell", "ask", "answer", "explain", "describe", "discuss",
    "see", "look", "watch", "hear", "listen", "feel", "smell", "taste", "notice", "observe",
    "think", "know", "understand", "remember", "forget", "believe", "hope", "wish", "want", "need",
    "like", "love", "hate", "prefer", "enjoy", "hate", "dislike", "fear", "worry", "stress",
    "make", "do", "create", "build", "break", "fix", "repair", "clean", "cook", "wash", "wear",
    "open", "close", "start", "finish", "continue", "pause", "cancel", "save", "delete", "share",
    "give", "take", "send", "receive", "buy", "sell", "pay", "cost", "spend", "save", "borrow", "lend",
    "call", "text", "email", "visit", "meet", "greet", "welcome", "introduce", "invite", "join",

    # Adjectives - Emotions
    "happy", "sad", "angry", "calm", "excited", "nervous", "scared", "proud", "shy", "brave",
    "confident", "worried", "anxious", "grateful", "hopeful", "lonely", "tired", "energetic",
    "sick", "healthy", "well", "better", "worse", "strong", "weak", "fine", "okay",

    # Adjectives - Descriptions
    "good", "bad", "best", "worst", "better", "nice", "great", "awesome", "amazing", "wonderful",
    "beautiful", "ugly", "pretty", "handsome", "cute", "lovely", "attractive", "elegant",
    "new", "old", "young", "ancient", "modern", "classic", "traditional", "fresh",
    "big", "small", "large", "tiny", "huge", "medium", "wide", "narrow", "tall", "short",
    "long", "short", "high", "low", "deep", "shallow", "thick", "thin", "heavy", "light",
    "fast", "slow", "quick", "rapid", "speedy", "easy", "difficult", "hard", "simple", "complex",
    "hot", "cold", "warm", "cool", "wet", "dry", "humid", "sunny", "cloudy", "rainy", "windy", "snowy",
    "clean", "dirty", "tidy", "neat", "messy", "organized", "bright", "dark", "light", "clear", "foggy",

    # Time & Date
    "today", "tomorrow", "yesterday", "now", "later", "soon", "soon", "early", "late",
    "morning", "afternoon", "evening", "night", "midnight", "noon", "dawn", "dusk",
    "second", "minute", "hour", "day", "week", "month", "year", "decade", "century",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
    "always", "usually", "often", "sometimes", "rarely", "never", "ever", "still", "already", "yet",

    # Places & Locations
    "home", "house", "school", "hospital", "office", "store", "market", "restaurant", "cafe",
    "room", "bedroom", "bathroom", "kitchen", "garden", "park", "library", "classroom", "building",
    "city", "town", "village", "country", "world", "earth", "street", "road", "avenue", "lane",
    "upstairs", "downstairs", "inside", "outside", "front", "back", "left", "right", "center", "middle",
    "here", "there", "somewhere", "anywhere", "everywhere", "nowhere", "near", "far", "close", "distant",

    # People & Relationships
    "mother", "father", "mom", "dad", "parent", "parents", "brother", "sister", "sibling", "siblings",
    "son", "daughter", "child", "children", "baby", "kid", "boy", "girl", "man", "woman", "person", "people",
    "husband", "wife", "spouse", "partner", "friend", "bestfriend", "buddy", "colleague", "coworker", "classmate",
    "teacher", "student", "doctor", "nurse", "patient", "doctor", "police", "driver", "chef", "artist",
    "family", "relative", "cousin", "uncle", "aunt", "grandmother", "grandfather", "grandparent", "grandparents",

    # Food & Drinks
    "food", "meal", "breakfast", "lunch", "dinner", "snack", "dessert", "appetizer", "maincourse",
    "rice", "bread", "noodle", "pasta", "vegetable", "fruit", "meat", "chicken", "fish", "beef", "pork",
    "egg", "milk", "cheese", "butter", "oil", "salt", "sugar", "spice", "sauce", "soup", "salad",
    "water", "juice", "tea", "coffee", "milk", "soda", "wine", "beer", "smoothie", "shake",
    "hungry", "thirsty", "full", "delicious", "sweet", "sour", "bitter", "spicy", "salty", "tasty",

    # Health & Body
    "body", "head", "hand", "foot", "eye", "ear", "nose", "mouth", "face", "hair", "skin", "bone",
    "heart", "brain", "stomach", "back", "arm", "leg", "finger", "toe", "neck", "shoulder",
    "pain", "hurt", "ache", "sore", "sick", "ill", "fever", "cold", "flu", "cough", "headache",
    "doctor", "medicine", "pill", "drug", "injection", "treatment", "therapy", "surgery", "checkup",
    "hospital", "clinic", "pharmacy", "emergency", "ambulance", "accident", "injury", "wound", "bleed",
    "healthy", "unhealthy", "fit", "weak", "strong", "sick", "allergy", "allergic", "dizzy", "nauseous",

    # Technology & Communication
    "phone", "computer", "laptop", "tablet", "camera", "television", "radio", "internet", "wifi",
    "message", "call", "video", "photo", "image", "screen", "keyboard", "mouse", "printer",
    "app", "application", "software", "program", "code", "data", "file", "folder", "document",
    "email", "website", "social", "media", "network", "signal", "battery", "charger", "cable",
    "send", "receive", "download", "upload", "share", "post", "comment", "like", "follow", "subscribe",

    # Education & Learning
    "book", "notebook", "pen", "pencil", "eraser", "ruler", "paper", "desk", "chair", "board",
    "chalkboard", "whiteboard", "projector", "map", "globe", "dictionary", "textbook", "homework",
    "test", "exam", "quiz", "lesson", "class", "course", "subject", "topic", "chapter", "unit",
    "grade", "score", "mark", "result", "pass", "fail", "graduate", "degree", "certificate", "diploma",
    "learn", "study", "practice", "review", "memorize", "understand", "explain", "demonstrate",
    "skill", "knowledge", "experience", "ability", "talent", "intelligence", "creativity",

    # Nature & Environment
    "nature", "forest", "mountain", "river", "ocean", "sea", "lake", "beach", "island", "desert",
    "tree", "flower", "plant", "grass", "leaf", "root", "seed", "fruit", "animal", "bird", "fish",
    "dog", "cat", "elephant", "tiger", "lion", "monkey", "snake", "butterfly", "bee", "ant",
    "sun", "moon", "star", "sky", "cloud", "rain", "snow", "wind", "storm", "thunder", "lightning",
    "earth", "world", "planet", "space", "environment", "climate", "weather", "season", "spring", "summer", "autumn", "winter",
    "pollution", "climate", "protect", "conserve", "recycle", "sustainable", "green", "clean",

    # Transportation & Travel
    "car", "bus", "train", "bicycle", "motorcycle", "airplane", "boat", "ship", "taxi", "truck",
    "vehicle", "transport", "traffic", "road", "highway", "bridge", "tunnel", "station", "airport",
    "ticket", "passport", "visa", "luggage", "baggage", "suitcase", "backpack", "travel", "trip", "journey",
    "destination", "departure", "arrival", "schedule", "delay", "cancel", "boarding", "gate", "seat",
    "driver", "passenger", "pilot", "captain", "conductor", "ticket", "fare", "route", "direction",

    # Shopping & Money
    "shop", "store", "market", "mall", "supermarket", "price", "cost", "cheap", "expensive", "discount",
    "buy", "sell", "pay", "money", "cash", "card", "credit", "debit", "bill", "coin", "note",
    "dollar", "cent", "pound", "euro", "yen", "vnd", "currency", "exchange", "bank", "account",
    "receipt", "change", "discount", "sale", "offer", "deal", "bargain", "budget", "save", "spend",
    "clothes", "shirt", "pants", "dress", "shoes", "hat", "bag", "watch", "jewelry", "accessory",

    # Work & Career
    "job", "work", "career", "profession", "occupation", "business", "company", "office", "employer", "employee",
    "salary", "income", "wage", "benefit", "bonus", "promotion", "raise", "resign", "retire", "quit",
    "interview", "hire", "recruit", "training", "meeting", "project", "deadline", "report", "presentation",
    "boss", "manager", "director", "leader", "team", "colleague", "coworker", "staff", "personnel", "hr",
    "profession", "expert", "specialist", "consultant", "advisor", "freelancer", "entrepreneur", "businessman", "businesswoman",

    # Colors & Shapes
    "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "grey",
    "color", "bright", "dark", "light", "pale", "vivid", "colorful", "plain", "pattern", "design",
    "circle", "square", "triangle", "rectangle", "line", "point", "edge", "corner", "center", "shape",

    # Numbers & Quantities
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "twenty", "thirty", "forty", "fifty", "hundred",
    "first", "second", "third", "fourth", "fifth", "last", "next", "previous", "final",
    "many", "few", "some", "all", "each", "every", "both", "half", "double", "triple", "single", "couple",
    "much", "more", "most", "less", "least", "little", "enough", "plenty", "lot", "number", "count", "total",

    # Questions & Connectors
    "where", "when", "why", "how", "what", "who", "which", "whom", "whose",
    "because", "therefore", "however", "although", "though", "but", "and", "or", "nor", "so",
    "if", "then", "else", "unless", "until", "while", "during", "before", "after", "since", "until",
    "again", "also", "too", "very", "really", "quite", "rather", "almost", "nearly", "already", "still", "yet",

    # Abstract Concepts
    "idea", "thought", "opinion", "view", "belief", "value", "principle", "justice", "freedom", "peace",
    "war", "conflict", "problem", "solution", "issue", "challenge", "goal", "plan", "strategy", "decision",
    "success", "failure", "achievement", "accomplishment", "progress", "development", "growth", "change", "progress",
    "time", "space", "life", "death", "birth", "history", "future", "past", "present", "moment",
    "right", "wrong", "true", "false", "real", "fake", "actual", "possible", "impossible", "certain",
    "important", "necessary", "essential", "basic", "fundamental", "significant", "urgent", "priority", "special", "normal", "usual", "common", "rare", "unique", "different", "same", "similar", "equal", "fair", "equal",

    # Communication & Language
    "language", "english", "vietnamese", "sign", "gesture", "communication", "conversation", "dialogue", "discussion", "debate",
    "word", "sentence", "phrase", "paragraph", "text", "writing", "reading", "speaking", "listening", "grammar", "vocabulary",
    "translate", "interpret", "explain", "describe", "express", "convey", "inform", "announce", "declare", "state",
    "silence", "quiet", "noise", "sound", "voice", "tone", "volume", "loud", "soft", "whisper", "shout",

    # Safety & Emergency
    "safe", "danger", "dangerous", "safe", "secure", "protect", "defend", "guard", "prevent", "avoid",
    "accident", "emergency", "disaster", "warning", "alert", "alarm", "risk", "hazard", "threat", "attack",
    "police", "firefighter", "ambulance", "rescue", "help", "support", "aid", "firstaid", "safety", "security",
    "rule", "law", "regulation", "policy", "right", "duty", "responsibility", "obligation", "permission", "prohibit"
]

# Common phrases organized by topic for practical communication
COMMON_PHRASES = [
    # Greetings & Farewells
    "good morning", "good afternoon", "good evening", "good night", "good day",
    "how are you", "how are you doing", "how have you been", "how is your day",
    "i am fine", "i am doing well", "i am great", "i am not bad", "i am okay",
    "nice to meet you", "pleased to meet you", "it is nice to see you",
    "goodbye", "see you later", "see you tomorrow", "see you soon", "take care",
    "have a nice day", "have a good day", "have a wonderful day", "sleep well",
    "welcome back", "long time no see", "how have you been",

    # Gratitude & Politeness
    "thank you", "thank you very much", "thanks a lot", "thank you so much",
    "i appreciate it", "i really appreciate", "i am grateful", "thank you for your help",
    "you are welcome", "no problem", "no worries", "it is nothing", "my pleasure",
    "sorry", "i am sorry", "i apologize", "excuse me", "pardon me", "forgive me",
    "it is okay", "do not worry", "no problem at all",

    # Requests & Permissions
    "please help me", "can you help me", "could you help me", "would you help me",
    "i need help", "i need assistance", "i need some help", "can i ask something",
    "may i ask", "may i go", "may i have", "could i borrow", "can i use",
    "please wait", "wait a moment", "just a minute", "one moment please",
    "please repeat", "say it again", "repeat please", "again please",
    "please speak slowly", "slower please", "louder please", "quieter please",
    "please write it down", "can you write it", "spell it please",

    # Questions
    "what is your name", "what is this", "what is that", "what is happening",
    "what do you mean", "what time is it", "what day is it", "what is the date",
    "where are you", "where is the bathroom", "where is home", "where should i go",
    "when is the class", "when does it start", "when should we meet", "when will it end",
    "why is that", "why did it happen", "why not", "why are you",
    "who are you", "who is that", "who is there", "who should i ask",
    "how are you feeling", "how do you feel", "how much is this", "how long",
    "how far", "how many", "how old", "how come",

    # Health & Emergency
    "i need a doctor", "call the doctor", "call an ambulance", "i need medicine",
    "i am sick", "i am not feeling well", "i feel sick", "i feel dizzy",
    "i have a headache", "my head hurts", "my stomach hurts", "my back hurts",
    "i am allergic", "i have allergy", "i need water", "i am thirsty",
    "where is the hospital", "is there a pharmacy", "i need first aid",
    "it is urgent", "please help quickly", "emergency situation", "help me please",
    "i cannot breathe", "i have chest pain", "i feel faint", "i need rest",

    # Food & Drinks
    "i am hungry", "i want to eat", "i need some food", "let us eat",
    "i want rice", "i want noodles", "i want vegetables", "i want fruit",
    "i want water", "i want coffee", "i want tea", "i want juice",
    "where can i eat", "is there a restaurant", "is there a cafe",
    "what do you recommend", "this is delicious", "i am full", "i am done eating",
    "can i have the menu", "how much is this meal", "i would like to order",
    "check please", "bill please", "how much for this", "too expensive",

    # Transportation & Directions
    "where is the station", "where is the bus stop", "where is the airport",
    "how do i get there", "which way is", "straight ahead", "turn left", "turn right",
    "go straight", "go back", "cross the street", "follow the signs",
    "how far is it", "how long does it take", "is it far", "is it near",
    "i need a taxi", "call me a taxi", "where is the parking", "is there parking",
    "what time does it leave", "what time does it arrive", "when is the next bus",
    "one ticket please", "two tickets please", "round trip ticket",

    # Time & Schedule
    "what time is it", "what is the time", "excuse me what time",
    "when does it start", "when does it end", "when is the break",
    "how long will it take", "how much time", "is it early", "is it late",
    "wait here", "meet me at", "see you at", "make an appointment",
    "today", "tomorrow", "yesterday", "next week", "last week",
    "morning class", "afternoon class", "evening class", "all day",

    # Shopping & Money
    "how much is this", "how much does it cost", "what is the price",
    "too expensive", "can you lower the price", "is there a discount",
    "i will take this", "i want to buy", "where is the cashier",
    "do you have", "do you accept card", "cash only", "change please",
    "do you have smaller", "do you have bigger", "different color please",
    "i am just looking", "can i try this on", "where is the fitting room",

    # Work & School
    "i am a student", "i am a teacher", "i work at", "i am intern",
    "where is the office", "which floor", "room number",
    "i have homework", "i have an exam", "i need to study", "i am studying",
    "class is starting", "class is over", "break time", "lunch break",
    "can you explain", "i do not understand", "please clarify",
    "when is the deadline", "how is my grade", "when is the due date",
    "i need more time", "can i have extension", "i will try my best",

    # Communication Difficulties (for deaf/mute users)
    "i am deaf", "i cannot hear", "i cannot speak", "i use sign language",
    "do you understand sign language", "can you fingerspell", "spell your name please",
    "please write it", "can we communicate in writing",
    "i understand you", "i comprehend", "i got it", "i see",
    "i do not understand", "i am confused", "please explain again",
    "slower please", "repeat please", "louder please", "clearer please",

    # Emotions & Feelings
    "i am happy", "i am sad", "i am angry", "i am excited",
    "i am worried", "i am nervous", "i am scared", "i am tired",
    "i am grateful", "i am proud", "i am surprised", "i am disappointed",
    "how are you feeling", "are you okay", "are you alright", "are you feeling well",
    "cheer up", "do not worry", "everything will be okay", "stay positive",
    "you are doing great", "keep it up", "well done", "good job",

    # Agreement & Disagreement
    "i agree", "i agree with you", "i disagree", "i do not agree",
    "that is correct", "that is wrong", "you are right", "you are wrong",
    "maybe", "perhaps", "i am not sure", "i do not know",
    "that is fine", "that is okay", "it is up to you", "your choice",
    "let us do it", "let us try", "let us go", "let us start",
    "what do you think", "your opinion", "my perspective", "in my opinion",

    # Family & Relationships
    "my family is", "i have a family", "family is important", "i love my family",
    "my mother", "my father", "my parents", "my siblings",
    "my friend", "my best friend", "my colleague", "my classmate",
    "nice to meet you", "this is my friend", "we are family",
    "how is your family", "tell me about your family", "family first",

    # Weather & Environment
    "how is the weather", "what is the weather like", "is it sunny", "is it raining",
    "it is hot today", "it is cold today", "it is warm today", "it is cool today",
    "beautiful weather", "terrible weather", "rainy day", "snowy day",
    "bring an umbrella", "wear a jacket", "stay hydrated", "be careful",
    "save the environment", "protect nature", "reduce reuse recycle",

    # Numbers & Quantities
    "one more", "one less", "try again", "once more",
    "how many", "how much", "too many", "too few",
    "give me some", "all of them", "none of them", "half of it",
    "double", "triple", "plenty", "enough", "a little", "a lot",

    # Technology & Communication
    "my phone is", "call me", "text me", "send me a message",
    "check your email", "i sent you", "did you get my",
    "wifi password", "how to connect", "is there wifi",
    "charge my phone", "battery is low", "phone is dead",
    "use my computer", "print this", "save the file",

    # Encouragement & Motivation
    "you can do it", "believe in yourself", "never give up",
    "keep trying", "practice makes perfect", "effort is key",
    "study hard", "work smart", "stay focused", "be persistent",
    "congratulations", "well done", "great job", "amazing work",
    "you are amazing", "you are awesome", "you are the best",
    "good luck", "best wishes", "i believe in you",

    # Common daily phrases
    "good idea", "bad idea", "let us go", "wait for me",
    "i am coming", "i will be there", "on my way", "almost there",
    "i am ready", "i am not ready", "just a moment", "give me time",
    "i forgot", "i remember", "i know", "i do not know",
    "i think so", "i hope so", "i doubt it", "probably",
    "definitely", "certainly", "absolutely", "maybe", "perhaps",

    # Practical emergency phrases
    "i need help", "help me please", "call for help", "please help",
    "i am lost", "i cannot find", "where am i", "help me get home",
    "i forgot my way", "can you show me", "please guide me",
    "this is my first time", "i am new here", "i do not know the area",
    "is there anyone who can help", "i need directions", "can you point"
]

# Context-based phrase suggestions for natural sentence completion
NEXT_TOKEN_PHRASES = {
    # Personal pronouns continuation
    "i": ["i am", "i need", "i want", "i can", "i will", "i feel", "i have", "i do", "i see", "i think", "i know", "i understand", "i appreciate", "i would"],
    "you": ["you are", "you can", "you should", "you need", "you have", "you will", "you do", "you must", "you might", "you could"],
    "we": ["we are", "we can", "we should", "we need", "we will", "we have", "we do", "we want", "we go", "we study"],
    "they": ["they are", "they have", "they will", "they can", "they do", "they need", "they want", "they should"],
    "he": ["he is", "he has", "he will", "he can", "he does", "he needs", "he wants", "he should", "he seems"],
    "she": ["she is", "she has", "she will", "she can", "she does", "she needs", "she wants", "she should", "she looks"],

    # Question words continuation
    "can": ["can you", "can i", "can we", "can you help me", "can you please", "can i have", "can i ask", "can you repeat", "can you explain", "can you speak"],
    "please": ["please help me", "please wait", "please repeat", "please speak slowly", "please write it down", "please explain", "please clarify", "please be patient"],
    "thank": ["thank you", "thanks a lot", "thank you very much", "thanks for", "thank you so much", "thank you for your"],
    "how": ["how are you", "how are you doing", "how old are you", "how far is it", "how long does it take", "how much is this", "how do you feel", "how is the weather"],
    "what": ["what is your name", "what is this", "what is that", "what time is it", "what do you mean", "what do you want", "what should i do", "what is the matter"],
    "where": ["where is the bathroom", "where are you", "where should i go", "where can i find", "where is the hospital", "where is the station", "where are we going", "where do you live"],
    "when": ["when does it start", "when will it end", "when is the class", "when should we meet", "when did this happen", "when can i", "when will you"],
    "why": ["why is that", "why did you", "why not", "why do you", "why should i", "why does it", "why are you", "why would you"],
    "who": ["who are you", "who is there", "who should i ask", "who is your", "who told you", "who knows", "who is calling"],

    # Common verbs continuation
    "i am": ["i am fine", "i am okay", "i am not okay", "i am hungry", "i am thirsty", "i am happy", "i am sad", "i am tired", "i am sick", "i am coming", "i am learning", "i am a student"],
    "i need": ["i need help", "i need water", "i need food", "i need medicine", "i need to rest", "i need some", "i need to go", "i need more time", "i need your help", "i need a doctor"],
    "i want": ["i want to go home", "i want to eat", "i want to drink", "i want to sleep", "i want some", "i want to ask", "i want to know", "i want to learn", "i want to", "i want you to"],
    "i have": ["i have a question", "i have a problem", "i have pain", "i have homework", "i have an idea", "i have been", "i have to go", "i have something", "i have no idea"],
    "i will": ["i will help you", "i will try", "i will be there", "i will call", "i will do it", "i will see", "i will come", "i will wait", "i will try my best"],

    # Greetings
    "good": ["good morning", "good afternoon", "good evening", "good night", "good day", "good job", "good work", "good idea", "good luck", "good point"],
    "hello": ["hello how are you", "hello everyone", "hello my friend", "hello there", "hello how is your day", "hello nice to see you"],
    "goodbye": ["goodbye for now", "goodbye see you", "goodbye and take care", "goodbye my friend", "goodbye and good luck"],
    "welcome": ["welcome to class", "welcome to our school", "welcome back", "welcome to the", "welcome everyone"],

    # Common phrases continuation
    "please help": ["please help me", "please help me please", "please help me with", "please help me understand"],
    "where is": ["where is the bathroom", "where is my phone", "where is my family", "where is the hospital", "where is the exit", "where is the entrance"],
    "what is": ["what is your name", "what is this", "what is happening", "what is the matter", "what is wrong", "what is going on"],
    "how are": ["how are you today", "how are you feeling", "how are you doing", "how are you all"],
    "nice to": ["nice to meet you", "nice to see you", "nice to talk to you", "nice to hear from you", "nice to work with you"],

    # Actions
    "call": ["call the doctor", "call my family", "call me", "call a taxi", "call the police", "call for help", "call me later"],
    "go": ["go home", "go to school", "go to the", "go straight", "go ahead", "go away", "go with me"],
    "come": ["come here", "come with me", "come to class", "come and see", "come when you can", "come back"],
    "take": ["take care", "take your time", "take this", "take me to", "take a seat", "take a break"],
    "give": ["give me", "give me a", "give me some", "give me water", "give me your", "give it to me"],
    "make": ["make it", "make a", "make sure", "make yourself", "make a decision", "make progress"],

    # Medical & Emergency
    "i feel": ["i feel sick", "i feel dizzy", "i feel pain", "i feel hungry", "i feel thirsty", "i feel tired", "i feel better", "i feel worse", "i feel okay"],
    "my": ["my name is", "my head hurts", "my stomach hurts", "my family", "my friend", "my phone", "my hand", "my back hurts", "my eyes"],
    "hurt": ["hurt my", "hurt myself", "hurt someone", "hurt badly", "hurt a little"],

    # Time references
    "today": ["today is", "today i am", "today we", "today is a", "today is the", "today is good"],
    "tomorrow": ["tomorrow i will", "tomorrow we", "tomorrow is", "tomorrow morning", "tomorrow afternoon", "tomorrow class"],
    "now": ["now i understand", "now i see", "now i know", "now i feel", "now i can", "now let us"],
    "later": ["later today", "later this", "later i will", "later we can", "later please"],

    # Communication
    "speak": ["speak slowly", "speak louder", "speak english", "speak vietnamese", "speak to me", "speak with you"],
    "repeat": ["repeat please", "repeat that", "repeat after me", "repeat again", "repeat what you said"],
    "understand": ["understand me", "understand you", "understand this", "understand the", "understand what", "understand now"],
    "explain": ["explain please", "explain this", "explain to me", "explain what", "explain how", "explain why"],

    # Emotions
    "i am happy": ["i am happy to", "i am happy today", "i am happy that", "i am happy you"],
    "i am sad": ["i am sad about", "i am sad that", "i am sad because", "i am sad today"],
    "do not": ["do not worry", "do not be", "do not go", "do not leave", "do not forget", "do not be afraid", "do not give up"],

    # Directions
    "turn": ["turn left", "turn right", "turn around", "turn back", "turn on", "turn off"],
    "straight": ["straight ahead", "straight to", "straight line", "straight to the", "straight ahead please"],
    "left": ["left side", "left hand", "left turn", "left at the", "on your left"],
    "right": ["right side", "right hand", "right turn", "right at the", "on your right"],

    # Common responses
    "yes": ["yes i am", "yes i can", "yes please", "yes of course", "yes that is", "yes i understand"],
    "no": ["no i am not", "no i cannot", "no thank you", "no i do not", "no that is not", "no way"],
    "okay": ["okay i understand", "okay let us", "okay that is", "okay good", "okay fine", "okay then"],
    "yes i": ["yes i am", "yes i can", "yes i have", "yes i want", "yes i will", "yes i need"],

    # Learning
    "study": ["study hard", "study more", "study for", "study with", "study together", "study english"],
    "learn": ["learn sign language", "learn english", "learn new", "learn fast", "learn together", "learn from"],
    "practice": ["practice more", "practice daily", "practice with", "practice makes", "practice english"],

    # Affirmations
    "you are": ["you are welcome", "you are right", "you are kind", "you are great", "you are amazing", "you are helpful", "you are a good"],
    "we are": ["we are friends", "we are learning", "we are in", "we are going", "we are here", "we are ready"],
    "it is": ["it is okay", "it is good", "it is fine", "it is a", "it is time", "it is my"],
}

WORD_FREQ_WORDS = []
WORD_FREQ_WORDS_SORTED = []
WORD_FREQ_AVAILABLE = False
if top_n_list is not None:
    try:
        raw_words = top_n_list("en", 50000)
        cleaned = []
        for item in raw_words:
            word = (item or "").strip().lower()
            if not word:
                continue
            if word == "a" or word == "i" or len(word) >= 2:
                cleaned.append(word)
        # Keep order by frequency for fallback scoring.
        WORD_FREQ_WORDS = list(dict.fromkeys(cleaned))
        WORD_FREQ_WORDS_SORTED = sorted(WORD_FREQ_WORDS)
        WORD_FREQ_AVAILABLE = True
    except Exception:
        WORD_FREQ_WORDS = []
        WORD_FREQ_WORDS_SORTED = []
        WORD_FREQ_AVAILABLE = False


class LegacyPredictorState:
    """State machine ported from final_pred.py for websocket usage."""

    def __init__(self):
        self.prev_char = ""
        self.count = -1
        self.ten_prev_char = [" " for _ in range(10)]
        self.sentence = ""
        self.cursor_position = 0
        self.word = ""
        self.word1 = " "
        self.word2 = " "
        self.word3 = " "
        self.word4 = " "
        self.suggestions = []
        self.current_symbol = ""
        self._suggestion_cache_key = ""
        self._suggestion_cache_values = []

    def clear_sentence(self):
        self.sentence = ""
        self.cursor_position = 0
        self.word = ""
        self.word1 = " "
        self.word2 = " "
        self.word3 = " "
        self.word4 = " "
        self.suggestions = []

    def apply_suggestion(self, suggestion: str):
        if not suggestion or not suggestion.strip():
            return
        start, end = self._current_word_bounds()
        replacement = suggestion.upper()
        self.sentence = self.sentence[:start] + replacement + self.sentence[end:]
        self.cursor_position = start + len(replacement)
        self.word = suggestion

    def delete_last_char(self):
        if self.cursor_position <= 0:
            return
        self.sentence = self.sentence[:self.cursor_position - 1] + self.sentence[self.cursor_position:]
        self.cursor_position -= 1

    def delete_forward_char(self):
        if self.cursor_position >= len(self.sentence):
            return
        self.sentence = self.sentence[:self.cursor_position] + self.sentence[self.cursor_position + 1:]

    def delete_last_word(self):
        if not self.sentence or self.cursor_position <= 0:
            return
        probe = self.cursor_position
        while probe > 0 and self.sentence[probe - 1] == " ":
            probe -= 1
        if probe == 0:
            self.cursor_position = 0
            return
        end = probe
        while probe > 0 and self.sentence[probe - 1] != " ":
            probe -= 1
        start = probe
        self.sentence = self.sentence[:start] + self.sentence[end:]
        self.cursor_position = start

    def add_space(self):
        self._insert_text(" ")

    def set_cursor(self, position: int):
        try:
            pos = int(position)
        except Exception:
            pos = len(self.sentence)
        self.cursor_position = max(0, min(pos, len(self.sentence)))

    def payload(self):
        self._refresh_suggestions()
        return {
            "current_letter": self.current_symbol,
            "sentence": self.sentence,
            "cursor_position": self.cursor_position,
            "suggestions": self.suggestions if self.suggestions else [self.word1, self.word2, self.word3, self.word4],
        }

    def _insert_text(self, text: str):
        if not text:
            return
        self.sentence = self.sentence[:self.cursor_position] + text + self.sentence[self.cursor_position:]
        self.cursor_position += len(text)

    def _current_word_bounds(self):
        left = self.cursor_position
        right = self.cursor_position
        while left > 0 and self.sentence[left - 1] != " ":
            left -= 1
        while right < len(self.sentence) and self.sentence[right] != " ":
            right += 1
        return left, right

    @staticmethod
    def _prefix_filter(candidates, prefix):
        norm_prefix = (prefix or "").strip().lower()
        if not norm_prefix:
            return list(candidates)
        return [item for item in candidates if item.lower().startswith(norm_prefix)]

    def _build_suggestions(self, current_word, context_sentence):
        ordered = []
        seen = set()

        def add_items(items):
            for raw in items:
                item = (raw or "").strip()
                if not item:
                    continue
                key = item.lower()
                if key in seen:
                    continue
                seen.add(key)
                ordered.append(item)

        current_word = (current_word or "").strip().lower()
        sentence_tokens = [token for token in context_sentence.strip().lower().split(" ") if token]
        last_token = sentence_tokens[-1] if sentence_tokens else ""
        last_bigram = f"{sentence_tokens[-2]} {sentence_tokens[-1]}" if len(sentence_tokens) >= 2 else ""
        cache_key = f"{current_word}|{last_token}|{last_bigram}|{' '.join(sentence_tokens[-4:])}"
        if cache_key == self._suggestion_cache_key:
            return self._suggestion_cache_values[:]

        def wordfreq_prefix(prefix, limit=120):
            if not WORD_FREQ_AVAILABLE or not prefix:
                return []
            start = bisect.bisect_left(WORD_FREQ_WORDS_SORTED, prefix)
            end = bisect.bisect_left(WORD_FREQ_WORDS_SORTED, prefix + "{")
            matches = WORD_FREQ_WORDS_SORTED[start:end]
            if len(matches) > limit:
                matches = matches[:limit]
            # Re-rank small prefix bucket by language frequency.
            if zipf_frequency is not None:
                matches = sorted(matches, key=lambda w: zipf_frequency(w, "en"), reverse=True)
            return matches

        # 1) Prioritize common words/phrases so users get practical communication first.
        add_items(self._prefix_filter(COMMON_WORDS, current_word))
        add_items(self._prefix_filter(COMMON_PHRASES, current_word))

        # 1.5) Large frequent-word source (keyboard-like suggestions).
        add_items(wordfreq_prefix(current_word))

        # 2) Add continuation phrases based on recent context.
        if last_token in NEXT_TOKEN_PHRASES:
            add_items(NEXT_TOKEN_PHRASES[last_token])

        if len(sentence_tokens) >= 2:
            add_items(self._prefix_filter(COMMON_PHRASES, last_bigram))
            if last_bigram in NEXT_TOKEN_PHRASES:
                add_items(NEXT_TOKEN_PHRASES[last_bigram])

        # 2.5) Continuation suggestions from common phrase bank.
        # If current tail matches the start of a known phrase, suggest the full phrase
        # and the next chunk so users can complete sentence quickly.
        max_tail = min(4, len(sentence_tokens))
        for tail_len in range(max_tail, 0, -1):
            tail = " ".join(sentence_tokens[-tail_len:]).strip()
            if not tail:
                continue
            for phrase in COMMON_PHRASES:
                lower_phrase = phrase.lower()
                if lower_phrase.startswith(f"{tail} ") and lower_phrase != tail:
                    add_items([phrase])
                    remainder = phrase[len(tail):].strip()
                    if remainder:
                        add_items([remainder])

        # 3) Keep spell-check suggestions, but filter by prefix for relevance.
        if current_word and _dict is not None:
            raw_dict_suggestions = _dict.suggest(current_word)
            prefix_matches = [s for s in raw_dict_suggestions if s.lower().startswith(current_word)]
            fuzzy_matches = [s for s in raw_dict_suggestions if not s.lower().startswith(current_word)]
            add_items(prefix_matches)
            add_items(fuzzy_matches[:6])

        result = ordered[:60]
        self._suggestion_cache_key = cache_key
        self._suggestion_cache_values = result[:]
        return result

    def _refresh_suggestions(self):
        self.word1 = self.word2 = self.word3 = self.word4 = " "
        self.suggestions = []
        if len(self.sentence.strip()) == 0:
            self.word = ""
            return

        left, right = self._current_word_bounds()
        word = self.sentence[left:self.cursor_position]
        self.word = word
        context_sentence = self.sentence[:self.cursor_position]
        suggestions = self._build_suggestions(word, context_sentence)
        self.suggestions = suggestions
        if len(suggestions) >= 1:
            self.word1 = suggestions[0]
        if len(suggestions) >= 2:
            self.word2 = suggestions[1]
        if len(suggestions) >= 3:
            self.word3 = suggestions[2]
        if len(suggestions) >= 4:
            self.word4 = suggestions[3]

    @staticmethod
    def distance(x, y):
        return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))

    def update(self, ch1, ch2, pts, ch3=None):
        pl = [ch1, ch2]

        l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
             [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
             [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
        if pl in l:
            if (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 0

        l = [[2, 2], [2, 1]]
        if pl in l:
            if pts[5][0] < pts[4][0]:
                ch1 = 0

        l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (pts[0][0] > pts[8][0] and pts[0][0] > pts[4][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and pts[5][0] > pts[4][0]:
                ch1 = 2

        l = [[6, 0], [6, 6], [6, 2]]
        pl = [ch1, ch2]
        if pl in l and self.distance(pts[8], pts[16]) < 52:
            ch1 = 2

        l = [[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1] and pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
                ch1 = 3

        l = [[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]]
        pl = [ch1, ch2]
        if pl in l and pts[4][0] > pts[0][0]:
            ch1 = 3

        l = [[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]]
        pl = [ch1, ch2]
        if pl in l and pts[2][1] + 15 < pts[16][1]:
            ch1 = 3

        l = [[6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l and self.distance(pts[4], pts[11]) > 55:
            ch1 = 4

        l = [[1, 4], [1, 6], [1, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(pts[4], pts[11]) > 50) and (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 4

        l = [[3, 6], [3, 4]]
        pl = [ch1, ch2]
        if pl in l and pts[4][0] < pts[0][0]:
            ch1 = 4

        l = [[2, 2], [2, 5], [2, 4]]
        pl = [ch1, ch2]
        if pl in l and pts[1][0] < pts[12][0]:
            ch1 = 4

        l = [[3, 6], [3, 5], [3, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] > pts[10][1]:
                ch1 = 5

        l = [[3, 2], [3, 1], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[4][1] + 17 > pts[8][1] and pts[4][1] + 17 > pts[12][1] and pts[4][1] + 17 > pts[16][1] and pts[4][1] + 17 > pts[20][1]:
                ch1 = 5

        l = [[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]]
        pl = [ch1, ch2]
        if pl in l and pts[4][0] > pts[0][0]:
            ch1 = 5

        l = [[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]]
        pl = [ch1, ch2]
        if pl in l and pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
            ch1 = 5

        l = [[5, 7], [5, 2], [5, 6]]
        pl = [ch1, ch2]
        if pl in l and pts[3][0] < pts[0][0]:
            ch1 = 7

        l = [[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]]
        pl = [ch1, ch2]
        if pl in l and pts[6][1] < pts[8][1]:
            ch1 = 7

        l = [[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]]
        pl = [ch1, ch2]
        if pl in l and pts[18][1] > pts[20][1]:
            ch1 = 7

        l = [[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]]
        pl = [ch1, ch2]
        if pl in l and pts[5][0] > pts[16][0]:
            ch1 = 6

        l = [[7, 2]]
        pl = [ch1, ch2]
        if pl in l and pts[18][1] < pts[20][1] and pts[8][1] < pts[10][1]:
            ch1 = 6

        l = [[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]]
        pl = [ch1, ch2]
        if pl in l and self.distance(pts[8], pts[16]) > 50:
            ch1 = 6

        l = [[4, 6], [4, 2], [4, 1], [4, 4]]
        pl = [ch1, ch2]
        if pl in l and self.distance(pts[4], pts[11]) < 60:
            ch1 = 6

        l = [[1, 4], [1, 6], [1, 0], [1, 2]]
        pl = [ch1, ch2]
        if pl in l and pts[5][0] - pts[4][0] - 15 > 0:
            ch1 = 6

        l = [[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
             [6, 3], [6, 4], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        l = [[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
             [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        l = [[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        l = [[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and
                    (pts[2][0] < pts[0][0]) and pts[4][1] > pts[14][1]):
                ch1 = 1

        l = [[4, 1], [4, 2], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(pts[4], pts[11]) < 50) and (
                    pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 1

        l = [[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and
                    (pts[2][0] < pts[0][0]) and pts[14][1] < pts[4][1]):
                ch1 = 1

        l = [[6, 6], [6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l and pts[5][0] - pts[4][0] - 15 < 0:
            ch1 = 1

        l = [[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        l = [[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if (pts[4][0] < pts[5][0] + 15) and (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]):
                ch1 = 7

        l = [[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1])) and pts[4][1] > pts[14][1]:
                ch1 = 1

        fg = 13
        l = [[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if not (pts[0][0] + fg < pts[8][0] and pts[0][0] + fg < pts[12][0] and pts[0][0] + fg < pts[16][0] and pts[0][0] + fg < pts[20][0]) and not (
                    pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and self.distance(pts[4], pts[11]) < 50:
                ch1 = 1

        l = [[5, 0], [5, 5], [0, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1]:
                ch1 = 1

        # subgroup decoding
        if ch1 == 0:
            ch1 = 'S'
            if pts[4][0] < pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0]:
                ch1 = 'A'
            if pts[4][0] > pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1]:
                ch1 = 'T'
            if pts[4][1] > pts[8][1] and pts[4][1] > pts[12][1] and pts[4][1] > pts[16][1] and pts[4][1] > pts[20][1]:
                ch1 = 'E'
            if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][0] > pts[14][0] and pts[4][1] < pts[18][1]:
                ch1 = 'M'
            if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][1] < pts[18][1] and pts[4][1] < pts[14][1]:
                ch1 = 'N'

        if ch1 == 2:
            ch1 = 'C' if self.distance(pts[12], pts[4]) > 42 else 'O'
        if ch1 == 3:
            ch1 = 'G' if self.distance(pts[8], pts[12]) > 72 else 'H'
        if ch1 == 7:
            ch1 = 'Y' if self.distance(pts[8], pts[4]) > 42 else 'J'
        if ch1 == 4:
            ch1 = 'L'
        if ch1 == 6:
            ch1 = 'X'
        if ch1 == 5:
            if pts[4][0] > pts[12][0] and pts[4][0] > pts[16][0] and pts[4][0] > pts[20][0]:
                # Loosen the Z rule to reduce Q/Z confusion in webcam noise.
                index_is_up = pts[8][1] <= (pts[7][1] + 8)
                index_is_forward = pts[8][0] > pts[6][0]
                ch1 = 'Z' if (index_is_up and index_is_forward) else 'Q'
            else:
                ch1 = 'P'

        if ch1 == 1:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'B'
            if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]:
                ch1 = 'D'
            if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'F'
            if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'I'
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] < pts[20][1]:
                ch1 = 'W'
            if (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] < pts[9][1]:
                ch1 = 'K'
            if ((self.distance(pts[8], pts[12]) - self.distance(pts[6], pts[10])) < 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 'U'
            if ((self.distance(pts[8], pts[12]) - self.distance(pts[6], pts[10])) >= 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and (pts[4][1] > pts[9][1]):
                ch1 = 'V'
            if (pts[8][0] > pts[12][0]) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 'R'

        if ch1 in (1, 'E', 'S', 'X', 'Y', 'B'):
            if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = "  "

        if ch1 in ('E', 'Y', 'B'):
            if (pts[4][0] < pts[5][0]) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]):
                ch1 = "next"

        if (ch1 in ('Next', 'B', 'C', 'H', 'F', 'X') or True) and (
                (pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and
                (pts[4][1] < pts[8][1] and pts[4][1] < pts[12][1] and pts[4][1] < pts[16][1] and pts[4][1] < pts[20][1]) and
                (pts[4][1] < pts[6][1] and pts[4][1] < pts[10][1] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1])):
            ch1 = 'Backspace'

        if ch1 == "next" and self.prev_char != "next":
            if self.ten_prev_char[(self.count - 2) % 10] != "next":
                if self.ten_prev_char[(self.count - 2) % 10] == "Backspace":
                    self.delete_last_char()
                else:
                    if self.ten_prev_char[(self.count - 2) % 10] != "Backspace":
                        self._insert_text(self.ten_prev_char[(self.count - 2) % 10])
            else:
                if self.ten_prev_char[(self.count - 0) % 10] != "Backspace":
                    self._insert_text(self.ten_prev_char[(self.count - 0) % 10])

        if ch1 == "  " and self.prev_char != "  ":
            self._insert_text("  ")

        self.prev_char = ch1
        self.current_symbol = ch1
        self.count += 1
        self.ten_prev_char[self.count % 10] = ch1

        self._refresh_suggestions()

        return self.current_symbol, self.sentence, self.suggestions if self.suggestions else [self.word1, self.word2, self.word3, self.word4]
