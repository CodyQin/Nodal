const DATA = {
  "total_characters": 23,
  "nodes": [
    {
      "id": "James_Sheppard",
      "label": "Dr. James Sheppard",
      "chapter": 1,
      "description": "Narrator, local doctor, and ultimately revealed as the murderer of Roger Ackroyd and blackmailer of Mrs. Ferrars.",
      "centrality": 9,
      "visual": { "size": 64 }
    },
    {
      "id": "Caroline_Sheppard",
      "label": "Caroline Sheppard",
      "chapter": 1,
      "description": "James's gossiping sister who lives with him.",
      "centrality": 3,
      "visual": { "size": 28 }
    },
    {
      "id": "Hercule_Poirot",
      "label": "Hercule Poirot",
      "chapter": 1,
      "description": "Famous private detective, retired to King's Abbot, neighbor to the Sheppards.",
      "centrality": 4,
      "visual": { "size": 34 }
    },
    {
      "id": "Roger_Ackroyd",
      "label": "Roger Ackroyd",
      "chapter": 1,
      "description": "Wealthy owner of Fernly Park, murder victim.",
      "centrality": 14,
      "visual": { "size": 94 }
    },
    {
      "id": "Mrs_Ferrars",
      "label": "Mrs. Ferrars",
      "chapter": 1,
      "description": "Widow who committed suicide; loved Roger Ackroyd and was blackmailed by James Sheppard.",
      "centrality": 4,
      "visual": { "size": 34 }
    },
    {
      "id": "Ashley_Ferrars",
      "label": "Ashley Ferrars",
      "chapter": 1,
      "description": "Deceased husband of Mrs. Ferrars, a drunkard poisoned by his wife.",
      "centrality": 2,
      "visual": { "size": 22 }
    },
    {
      "id": "Ralph_Paton",
      "label": "Ralph Paton",
      "chapter": 1,
      "description": "Roger Ackroyd's stepson, secretly married to Ursula Bourne.",
      "centrality": 4,
      "visual": { "size": 34 }
    },
    {
      "id": "Mrs_Cecil_Ackroyd",
      "label": "Mrs. Cecil Ackroyd",
      "chapter": 1,
      "description": "Widow of Roger's brother, financially dependent on Roger.",
      "centrality": 2,
      "visual": { "size": 22 }
    },
    {
      "id": "Flora_Ackroyd",
      "label": "Flora Ackroyd",
      "chapter": 1,
      "description": "Roger's niece, daughter of Mrs. Cecil Ackroyd.",
      "centrality": 4,
      "visual": { "size": 34 }
    },
    {
      "id": "Hector_Blunt",
      "label": "Major Hector Blunt",
      "chapter": 1,
      "description": "Big game hunter and guest at Fernly Park.",
      "centrality": 2,
      "visual": { "size": 22 }
    },
    {
      "id": "Geoffrey_Raymond",
      "label": "Geoffrey Raymond",
      "chapter": 1,
      "description": "Secretary to Roger Ackroyd.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Miss_Russell",
      "label": "Miss Russell",
      "chapter": 1,
      "description": "Housekeeper at Fernly Park, mother of Charles Kent.",
      "centrality": 2,
      "visual": { "size": 22 }
    },
    {
      "id": "Parker",
      "label": "Parker",
      "chapter": 1,
      "description": "Butler at Fernly Park.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Ursula_Bourne",
      "label": "Ursula Bourne",
      "chapter": 1,
      "description": "Parlormaid at Fernly Park, secretly married to Ralph Paton.",
      "centrality": 3,
      "visual": { "size": 28 }
    },
    {
      "id": "Charles_Kent",
      "label": "Charles Kent",
      "chapter": 1,
      "description": "Drug addict and illegitimate son of Miss Russell.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Inspector_Raglan",
      "label": "Inspector Raglan",
      "chapter": 1,
      "description": "Police inspector from Cranchester investigating the murder.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Inspector_Davis",
      "label": "Inspector Davis",
      "chapter": 1,
      "description": "Local police inspector at King's Abbot.",
      "centrality": 0,
      "visual": { "size": 10 }
    },
    {
      "id": "Colonel_Melrose",
      "label": "Colonel Melrose",
      "chapter": 1,
      "description": "Chief Constable of the county.",
      "centrality": 0,
      "visual": { "size": 10 }
    },
    {
      "id": "Mr_Hammond",
      "label": "Mr. Hammond",
      "chapter": 1,
      "description": "Family solicitor.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Miss_Ganett",
      "label": "Miss Ganett",
      "chapter": 1,
      "description": "Village gossip and friend of Caroline Sheppard.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Mrs_Folliott",
      "label": "Mrs. Folliott",
      "chapter": 1,
      "description": "Ursula Bourne's sister and previous employer.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Annie",
      "label": "Annie",
      "chapter": 1,
      "description": "House parlormaid for the Sheppards.",
      "centrality": 1,
      "visual": { "size": 16 }
    },
    {
      "id": "Elsie_Dale",
      "label": "Elsie Dale",
      "chapter": 1,
      "description": "Housemaid at Fernly Park.",
      "centrality": 1,
      "visual": { "size": 16 }
    }
  ],
  "edges": [
    {
      "id": "rel_1",
      "source": "James_Sheppard",
      "target": "Caroline_Sheppard",
      "chapter": 1,
      "relation": {
        "type": "sibling",
        "label": "sibling",
        "description": "Brother and sister living together."
      },
      "visual": { "color": "#FFD700", "weight": 3 },
      "weight": 0.9
    },
    {
      "id": "rel_2",
      "source": "James_Sheppard",
      "target": "Hercule_Poirot",
      "chapter": 1,
      "relation": {
        "type": "neighbor",
        "label": "neighbor",
        "description": "Immediate neighbors."
      },
      "visual": { "color": "#32CD32", "weight": 2 },
      "weight": 0.8
    },
    {
      "id": "rel_3",
      "source": "James_Sheppard",
      "target": "Roger_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "murderer",
        "label": "murderer",
        "description": "Sheppard murdered Ackroyd to cover up his blackmail."
      },
      "visual": { "color": "#FF0000", "weight": 4 },
      "weight": 1.0
    },
    {
      "id": "rel_4",
      "source": "James_Sheppard",
      "target": "Mrs_Ferrars",
      "chapter": 1,
      "relation": {
        "type": "blackmailer",
        "label": "blackmailer",
        "description": "Sheppard blackmailed Mrs. Ferrars regarding her husband's death."
      },
      "visual": { "color": "#000000", "weight": 4 },
      "weight": 0.9
    },
    {
      "id": "rel_5",
      "source": "James_Sheppard",
      "target": "Roger_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "doctor",
        "label": "doctor",
        "description": "Sheppard was Ackroyd's physician."
      },
      "visual": { "color": "#00FFFF", "weight": 2 },
      "weight": 0.7
    },
    {
      "id": "rel_6",
      "source": "James_Sheppard",
      "target": "Roger_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "friend",
        "label": "friend",
        "description": "Close friends."
      },
      "visual": { "color": "#1E90FF", "weight": 2 },
      "weight": 0.8
    },
    {
      "id": "rel_7",
      "source": "James_Sheppard",
      "target": "Hercule_Poirot",
      "chapter": 1,
      "relation": {
        "type": "colleague",
        "label": "colleague",
        "description": "Sheppard acted as chronicler and assistant to Poirot."
      },
      "visual": { "color": "#4682B4", "weight": 3 },
      "weight": 0.9
    },
    {
      "id": "rel_8",
      "source": "Roger_Ackroyd",
      "target": "Mrs_Ferrars",
      "chapter": 1,
      "relation": {
        "type": "lover",
        "label": "lover",
        "description": "Intended to marry."
      },
      "visual": { "color": "#FF69B4", "weight": 3 },
      "weight": 0.9
    },
    {
      "id": "rel_9",
      "source": "Roger_Ackroyd",
      "target": "Ralph_Paton",
      "chapter": 1,
      "relation": {
        "type": "stepfather",
        "label": "stepfather",
        "description": "Roger was Ralph's stepfather and guardian."
      },
      "visual": { "color": "#FF8C00", "weight": 3 },
      "weight": 0.8
    },
    {
      "id": "rel_10",
      "source": "Roger_Ackroyd",
      "target": "Flora_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "uncle",
        "label": "uncle",
        "description": "Uncle and niece."
      },
      "visual": { "color": "#FFA500", "weight": 3 },
      "weight": 0.7
    },
    {
      "id": "rel_11",
      "source": "Roger_Ackroyd",
      "target": "Mrs_Cecil_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "in_law",
        "label": "brother-in-law",
        "description": "Brother-in-law providing financial support."
      },
      "visual": { "color": "#800080", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_12",
      "source": "Roger_Ackroyd",
      "target": "Hector_Blunt",
      "chapter": 1,
      "relation": {
        "type": "friend",
        "label": "friend",
        "description": "Old friends."
      },
      "visual": { "color": "#1E90FF", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_13",
      "source": "Roger_Ackroyd",
      "target": "Geoffrey_Raymond",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Ackroyd employed Raymond as secretary."
      },
      "visual": { "color": "#708090", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_14",
      "source": "Roger_Ackroyd",
      "target": "Miss_Russell",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Ackroyd employed Russell as housekeeper."
      },
      "visual": { "color": "#708090", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_15",
      "source": "Roger_Ackroyd",
      "target": "Parker",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Ackroyd employed Parker as butler."
      },
      "visual": { "color": "#708090", "weight": 2 },
      "weight": 0.5
    },
    {
      "id": "rel_16",
      "source": "Roger_Ackroyd",
      "target": "Ursula_Bourne",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Ackroyd employed Ursula as parlormaid."
      },
      "visual": { "color": "#708090", "weight": 2 },
      "weight": 0.5
    },
    {
      "id": "rel_17",
      "source": "Ralph_Paton",
      "target": "Ursula_Bourne",
      "chapter": 1,
      "relation": {
        "type": "spouse",
        "label": "spouse",
        "description": "Secretly married."
      },
      "visual": { "color": "#C71585", "weight": 4 },
      "weight": 1.0
    },
    {
      "id": "rel_18",
      "source": "Ralph_Paton",
      "target": "Flora_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "fiance",
        "label": "fiancé",
        "description": "Engaged for financial/family reasons."
      },
      "visual": { "color": "#FFB6C1", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_19",
      "source": "Flora_Ackroyd",
      "target": "Hector_Blunt",
      "chapter": 1,
      "relation": {
        "type": "lover",
        "label": "lover",
        "description": "Romantic interest developed during the investigation."
      },
      "visual": { "color": "#FF69B4", "weight": 2 },
      "weight": 0.7
    },
    {
      "id": "rel_20",
      "source": "Miss_Russell",
      "target": "Charles_Kent",
      "chapter": 1,
      "relation": {
        "type": "parent",
        "label": "mother",
        "description": "Russell is the secret mother of Charles Kent."
      },
      "visual": { "color": "#8A2BE2", "weight": 3 },
      "weight": 0.9
    },
    {
      "id": "rel_21",
      "source": "Mrs_Ferrars",
      "target": "Ashley_Ferrars",
      "chapter": 1,
      "relation": {
        "type": "murderer",
        "label": "murderer",
        "description": "Mrs. Ferrars poisoned her husband."
      },
      "visual": { "color": "#FF0000", "weight": 4 },
      "weight": 1.0
    },
    {
      "id": "rel_22",
      "source": "Mrs_Ferrars",
      "target": "Ashley_Ferrars",
      "chapter": 1,
      "relation": {
        "type": "spouse",
        "label": "spouse",
        "description": "Wife and husband."
      },
      "visual": { "color": "#C71585", "weight": 2 },
      "weight": 0.5
    },
    {
      "id": "rel_23",
      "source": "James_Sheppard",
      "target": "Annie",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Sheppard employed Annie."
      },
      "visual": { "color": "#708090", "weight": 1 },
      "weight": 0.3
    },
    {
      "id": "rel_24",
      "source": "Caroline_Sheppard",
      "target": "Miss_Ganett",
      "chapter": 1,
      "relation": {
        "type": "friend",
        "label": "friend",
        "description": "Gossip companions."
      },
      "visual": { "color": "#1E90FF", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_25",
      "source": "Ursula_Bourne",
      "target": "Mrs_Folliott",
      "chapter": 1,
      "relation": {
        "type": "sibling",
        "label": "sister",
        "description": "Sisters."
      },
      "visual": { "color": "#FFD700", "weight": 3 },
      "weight": 0.8
    },
    {
      "id": "rel_26",
      "source": "Mr_Hammond",
      "target": "Roger_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "lawyer",
        "label": "lawyer",
        "description": "Hammond acted as solicitor for Ackroyd."
      },
      "visual": { "color": "#A9A9A9", "weight": 2 },
      "weight": 0.5
    },
    {
      "id": "rel_27",
      "source": "Hercule_Poirot",
      "target": "Inspector_Raglan",
      "chapter": 1,
      "relation": {
        "type": "colleague",
        "label": "colleague",
        "description": "Worked together on the investigation."
      },
      "visual": { "color": "#4682B4", "weight": 2 },
      "weight": 0.6
    },
    {
      "id": "rel_28",
      "source": "James_Sheppard",
      "target": "Ralph_Paton",
      "chapter": 1,
      "relation": {
        "type": "friend",
        "label": "friend",
        "description": "Sheppard was a trusted friend."
      },
      "visual": { "color": "#1E90FF", "weight": 2 },
      "weight": 0.7
    },
    {
      "id": "rel_29",
      "source": "Mrs_Cecil_Ackroyd",
      "target": "Flora_Ackroyd",
      "chapter": 1,
      "relation": {
        "type": "parent",
        "label": "mother",
        "description": "Mother and daughter."
      },
      "visual": { "color": "#8A2BE2", "weight": 3 },
      "weight": 0.8
    },
    {
      "id": "rel_30",
      "source": "Hercule_Poirot",
      "target": "Caroline_Sheppard",
      "chapter": 1,
      "relation": {
        "type": "acquaintance",
        "label": "acquaintance",
        "description": "Poirot cultivated Caroline for information."
      },
      "visual": { "color": "#D3D3D3", "weight": 1 },
      "weight": 0.5
    },
    {
      "id": "rel_31",
      "source": "Roger_Ackroyd",
      "target": "Elsie_Dale",
      "chapter": 1,
      "relation": {
        "type": "employer",
        "label": "employer",
        "description": "Ackroyd employed Elsie as housemaid."
      },
      "visual": { "color": "#708090", "weight": 1 },
      "weight": 0.3
    }
  ]
};

export default DATA;