export const subjectsData = [
    {
      class: "Class 12",
      subjects: [
        {
          name: "Biology",
          chapters: [
                    "Reproduction",
                    "Sexual Reproduction in Flowering Plants",
                    
                    ]
        },
        {
          name: "Physics",
          chapters: [
                    "Electric Charges and Fields",
                    "Electrostatic Potential and Capacitance",
                    
                ]
          
        },
        {
            name: "Economics",
            chapters: [
            "Introduction to Microeconomics",
            "Theory of Consumer Behavior",
            ]
        
        }
        ],
     },
    {
      class: "Class 11",
      subjects: [
        {
          name: "Biology",
          chapters: ["The Living World",
                    "Biological Classification",
          ]
                    
        },
        {
          name: "Physics",
          chapters: [
            "Physical World",
            "Units and Measurements",
            
          ]
          
        },{
            name:"Economics",
            chapters: [
            "Indian Economy on the Eve of Independence",
            "Indian Economy 1950-1990",
             "Index Numbers"
          ]
        }
      ]
    }
  ];
  
  export const questionTypes = ["mcq", "assertionReason", "shortAnswer", "longAnswer", "caseBased"];

  export const questionCount = {
    mcq: 6,              // More MCQs
    assertionReason: 5,  // Medium
    shortAnswer: 5,      // More short answers
    longAnswer: 2,       // Fewer long answers
    caseBased: 2         // Fewer case-based questions
  };
  
  