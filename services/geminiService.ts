import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, LectureSlide, CaseStudy, SharedContent, GeneratedLecture, FAQ } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this environment, we assume the key is set.
  console.warn("API_KEY environment variable not set. Using a placeholder. This will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    topic: {
      type: Type.STRING,
      description: "The main topic of the quiz."
    },
    questions: {
      type: Type.ARRAY,
      description: "A list of questions for the quiz.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: {
            type: Type.STRING,
            description: "The text of the multiple-choice question."
          },
          options: {
            type: Type.ARRAY,
            description: "An array of 4 possible answers.",
            items: {
              type: Type.STRING
            }
          },
          correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the options array."
          }
        },
        required: ["questionText", "options", "correctAnswerIndex"]
      }
    }
  },
  required: ["topic", "questions"]
};

const lectureSlidesSchema = {
    type: Type.OBJECT,
    properties: {
        slides: {
            type: Type.ARRAY,
            description: "An array of lecture slides.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "The title of the slide."
                    },
                    points: {
                        type: Type.ARRAY,
                        description: "An array of bullet points for the slide content.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["title", "points"]
            }
        }
    },
    required: ["slides"]
};

const caseStudySchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The title of the case study."
        },
        introduction: {
            type: Type.STRING,
            description: "An introduction or background for the case study."
        },
        problem: {
            type: Type.STRING,
            description: "The core problem or challenge presented in the case study."
        },
        solution: {
            type: Type.STRING,
            description: "The solution, actions taken, or process implemented."
        },
        conclusion: {
            type: Type.STRING,
            description: "The results, outcome, and key takeaways of the case study."
        }
    },
    required: ["title", "introduction", "problem", "solution", "conclusion"]
};

export const generateQuiz = async (
  topic: string,
  numQuestions: number,
  difficulty: string
// FIX: Changed return type to Omit<Quiz, 'classCode'> as classCode is not available here.
): Promise<Omit<Quiz, 'classCode'>> => {
  const prompt = `Generate a quiz about "${topic}" with exactly ${numQuestions} multiple-choice questions. The difficulty level should be ${difficulty}. Each question must have exactly 4 options. Ensure one option is clearly correct.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const responseText = response.text.trim();
    if (!responseText) {
        throw new Error("Received an empty response from the AI model.");
    }
    const quizData = JSON.parse(responseText);
    
    // Validate and format the data
    const formattedQuiz: Omit<Quiz, 'classCode'> = {
        id: new Date().toISOString(),
        topic: quizData.topic || topic,
        questions: (quizData.questions || []).map((q: any, index: number) => ({
            questionText: q.questionText || `Question ${index + 1}`,
            options: q.options && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4 ? q.correctAnswerIndex : 0,
        })).slice(0, numQuestions) // Ensure correct number of questions
    };

    return formattedQuiz;

  } catch (error) {
    console.error("Error generating quiz with Gemini API:", error);
    throw new Error("Failed to generate quiz. The AI model might be busy or there was an issue with the request.");
  }
};

export const generateQuizFromContent = async (
  content: string,
  numQuestions: number,
  difficulty: string
// FIX: Changed return type to Omit<Quiz, 'classCode'> as classCode is not available here.
): Promise<Omit<Quiz, 'classCode'>> => {
  const prompt = `Generate a quiz based on the following content. Create exactly ${numQuestions} multiple-choice questions with a difficulty level of ${difficulty}. Each question must have exactly 4 options. Ensure one option is clearly correct.

Content:
---
${content}
---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const responseText = response.text.trim();
    if (!responseText) {
        throw new Error("Received an empty response from the AI model.");
    }
    const quizData = JSON.parse(responseText);
    
    const formattedQuiz: Omit<Quiz, 'classCode'> = {
        id: new Date().toISOString(),
        topic: quizData.topic || "Quiz from generated content",
        questions: (quizData.questions || []).map((q: any, index: number) => ({
            questionText: q.questionText || `Question ${index + 1}`,
            options: q.options && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4 ? q.correctAnswerIndex : 0,
        })).slice(0, numQuestions)
    };

    return formattedQuiz;

  } catch (error) {
    console.error("Error generating quiz from content with Gemini API:", error);
    throw new Error("Failed to generate quiz from content.");
  }
};


export const generateLectureSlides = async (outline: string): Promise<{ slides: LectureSlide[] }> => {
    const prompt = `Based on the following topic outline, generate a set of lecture slides. Each slide should have a clear title and several concise bullet points.

Topic Outline:
---
${outline}
---`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: lectureSlidesSchema,
            },
        });
        
        const responseText = response.text.trim();
        if (!responseText) {
            throw new Error("Received an empty response from the AI model.");
        }
        const data = JSON.parse(responseText);
        if (!data.slides || !Array.isArray(data.slides)) {
            throw new Error("Invalid format received from AI for slides.");
        }
        return data;
    } catch (error) {
        console.error("Error generating lecture slides:", error);
        throw new Error("Failed to generate lecture slides from the outline.");
    }
};

export const generateCaseStudy = async (outline: string): Promise<Omit<CaseStudy, 'id' | 'classCode'>> => {
    const prompt = `Based on the following topic outline, generate a detailed case study. It should include a title, introduction, a central problem, a proposed solution, and a conclusion with key takeaways.

Topic Outline:
---
${outline}
---`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: caseStudySchema,
            },
        });
        
        const responseText = response.text.trim();
        if (!responseText) {
            throw new Error("Received an empty response from the AI model.");
        }
        const data = JSON.parse(responseText);

        if (!data.title || !data.introduction || !data.problem || !data.solution || !data.conclusion) {
            throw new Error("Invalid format received from AI for case study.");
        }
        return data;
    } catch (error) {
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from the outline.");
    }
};


export const summarizeText = async (text: string): Promise<string> => {
    const prompt = `Summarize the following content for a student in a few key points:\n\n---\n${text}\n---`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        throw new Error("Failed to summarize content.");
    }
};

export const translateText = async (text: string, language: string): Promise<string> => {
    const prompt = `Translate the following text to ${language}:\n\n---\n${text}\n---`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error(`Failed to translate content to ${language}.`);
    }
};

export const analyzeImageContent = async (base64Image: string, mimeType: string): Promise<string> => {
    const prompt = "Describe this image and extract any text you see. Present the text first, then the description.";
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image content.");
    }
};

export const getExplanation = async (question: string): Promise<string> => {
    const prompt = `You are a helpful and friendly teaching assistant. Explain the following concept clearly, as if you were talking to a high school student. Use simple terms and provide a short, clear example to illustrate your point.

Student's question: "${question}"`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting explanation:", error);
        throw new Error("Failed to get an explanation from the AI assistant.");
    }
};

export const performSmartSearch = async (
    query: string,
    knowledgeBase: {
        quizzes: Quiz[];
        lectures: GeneratedLecture[];
        caseStudies: CaseStudy[];
        sharedContent: SharedContent[];
        faqs: FAQ[];
    }
): Promise<{ answer: string; sources: { name: string; type: string }[] }> => {
    const { quizzes, lectures, caseStudies, sharedContent, faqs } = knowledgeBase;
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    if (queryKeywords.length === 0) {
        return { answer: "Please enter a search query.", sources: [] };
    }

    const retrievedDocs: { name: string; type: string; content: string }[] = [];

    // Search Quizzes
    quizzes.forEach(quiz => {
        const content = `Topic: ${quiz.topic}. Questions: ${quiz.questions.map(q => q.questionText).join(' ')}`;
        if (queryKeywords.some(kw => content.toLowerCase().includes(kw))) {
            retrievedDocs.push({ name: quiz.topic, type: 'Quiz', content });
        }
    });

    // Search Lectures
    lectures.forEach(lecture => {
        const content = `Topic: ${lecture.topic}. Slides: ${lecture.slides.map(s => `${s.title}: ${s.points.join(' ')}`).join('. ')}`;
        if (queryKeywords.some(kw => content.toLowerCase().includes(kw))) {
            retrievedDocs.push({ name: lecture.topic, type: 'Lecture', content });
        }
    });

    // Search Case Studies
    caseStudies.forEach(study => {
        const content = `Title: ${study.title}. Content: ${study.introduction} ${study.problem} ${study.solution} ${study.conclusion}`;
        if (queryKeywords.some(kw => content.toLowerCase().includes(kw))) {
            retrievedDocs.push({ name: study.title, type: 'Case Study', content });
        }
    });

    // Search Shared Content
    sharedContent.forEach(item => {
        const content = `Title: ${item.title}. Description: ${item.description}. ${item.type === 'text' ? `Content: ${item.content}` : `File: ${item.fileName}`}`;
        if (queryKeywords.some(kw => content.toLowerCase().includes(kw))) {
            retrievedDocs.push({ name: item.title, type: 'Shared Content', content });
        }
    });
    
    // Search FAQs
    faqs.forEach(faq => {
        const content = `Question: ${faq.question}. Answer: ${faq.answer}`;
        if (queryKeywords.some(kw => content.toLowerCase().includes(kw))) {
            retrievedDocs.push({ name: faq.question, type: 'FAQ', content });
        }
    });
    
    if (retrievedDocs.length === 0) {
        return { answer: "I could not find any relevant information matching your search.", sources: [] };
    }

    const context = retrievedDocs.map(doc => `Source (${doc.type}): ${doc.name}\nContent: ${doc.content}`).join('\n\n---\n\n');
    
    const prompt = `You are a helpful AI assistant for a classroom platform. Based ONLY on the following context, provide a concise answer to the user's question. Do not use any outside knowledge. If the answer is not found in the context, state that you could not find a definitive answer in the provided materials.\n\nContext:\n---\n${context}\n---\n\nUser Question: "${query}"`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const sources = retrievedDocs.map(doc => ({ name: doc.name, type: doc.type }));
        return { answer: response.text, sources };

    } catch (error) {
        console.error("Error with Smart Search generation:", error);
        throw new Error("The AI search assistant is currently unavailable.");
    }
};