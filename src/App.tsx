import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import "./index.css";
import questionsData from "./questions.json";

interface Answer {
  text: string;
  correct: boolean;
}

interface Question {
  number: number;
  question: string;
  answers: Answer[];
}

// New interfaces to match the updated JSON format
interface JsonQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface JsonData {
  title: string;
  department: string;
  university: string;
  course: string;
  questions: JsonQuestion[];
}

interface QuizStats {
  total: number;
  correct: number;
  percentage: number;
}

export function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState<QuizStats>({
    total: 0,
    correct: 0,
    percentage: 0,
  });
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { question: Question; wasCorrect: boolean; selectedAnswer: string }[]
  >([]);
  const [showAnswered, setShowAnswered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [confettiOpacity, setConfettiOpacity] = useState(1);
  const fadeAnimationRef = useRef<number | null>(null);
  // Add new state variables for answer feedback
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null
  );
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(
    null
  );
  // Add state to track the correct answer index
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(
    null
  );

  // Track window dimensions for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
    };
  }, []);

  // Convert JSON questions to app format
  const convertQuestions = (jsonData: JsonData): Question[] => {
    return jsonData.questions.map((q, index) => {
      // Create answers array by mapping options and marking the correct one
      const answers: Answer[] = q.options.map((option) => ({
        text: option,
        correct: option === q.answer,
      }));

      return {
        number: index + 1, // Add a question number
        question: q.question,
        answers,
      };
    });
  };

  // Initialize and shuffle questions
  useEffect(() => {
    if (questionsData.questions && questionsData.questions.length > 0) {
      const convertedQuestions = convertQuestions(questionsData as JsonData);
      setQuestions([...convertedQuestions]);
      getNextQuestion([...convertedQuestions]);
    }
  }, []);

  // Get next random question
  const getNextQuestion = (questionSet: Question[] = questions) => {
    if (questionSet.length === 0) return;

    const randomIndex = Math.floor(Math.random() * questionSet.length);
    const question = { ...questionSet[randomIndex] };

    // Shuffle answers
    const shuffledAnswers = [...question.answers].sort(
      () => Math.random() - 0.5
    );
    setCurrentQuestion({ ...question, answers: shuffledAnswers });
  };

  // Handle animation of confetti fade
  const startConfettiFade = () => {
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const fadeOut = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Exponential fade: progress^2 for faster initial fade that slows down
      const newOpacity = Math.max(0, 1 - progress * progress);
      setConfettiOpacity(newOpacity);

      if (progress < 1) {
        fadeAnimationRef.current = requestAnimationFrame(fadeOut);
      } else {
        setShowConfetti(false);
        setConfettiOpacity(1); // Reset for next time
      }
    };

    fadeAnimationRef.current = requestAnimationFrame(fadeOut);
  };

  // Handle answer selection
  const handleAnswer = (answer: Answer, index: number) => {
    if (!currentQuestion || evaluatingAnswer) return;

    // Set selected answer and start evaluation
    setSelectedAnswerIndex(index);
    setEvaluatingAnswer(true);
    setAnsweredCorrectly(answer.correct);

    // If answer is incorrect, find and store the correct answer index
    if (!answer.correct) {
      const correctIndex = currentQuestion.answers.findIndex((a) => a.correct);
      setCorrectAnswerIndex(correctIndex);
    } else {
      setCorrectAnswerIndex(null);
    }

    const wasCorrect = answer.correct;
    const newStats = {
      total: stats.total + 1,
      correct: wasCorrect ? stats.correct + 1 : stats.correct,
      percentage: 0,
    };

    // Calculate percentage
    newStats.percentage = Math.round((newStats.correct / newStats.total) * 100);

    setStats(newStats);

    // Trigger confetti effect if answer was correct
    if (wasCorrect) {
      setShowConfetti(true);
      startConfettiFade(); // Start the fade animation
    }

    // Save answered question
    setAnsweredQuestions([
      ...answeredQuestions,
      {
        question: currentQuestion,
        wasCorrect,
        selectedAnswer: answer.text,
      },
    ]);

    // Delay before showing next question
    setTimeout(() => {
      setEvaluatingAnswer(false);
      setSelectedAnswerIndex(null);
      setAnsweredCorrectly(null);
      setCorrectAnswerIndex(null); // Reset correct answer index
      // Get next question
      getNextQuestion();
    }, 1500); // 1.5 second delay for feedback
  };

  // Toggle answered questions view
  const toggleAnsweredQuestions = () => {
    setShowAnswered(!showAnswered);
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl w-full">
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={500}
          opacity={confettiOpacity}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
        />
      )}

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{questionsData.title}</h1>
        <p>{questionsData.department}</p>
        <p>{questionsData.university}</p>
        <p>{questionsData.course}</p>
      </div>

      <div className="stats-container bg-slate-100 p-4 rounded-md mb-6 text-center">
        <h2 className="text-xl font-semibold">Quiz Statistics</h2>
        <p>Total questions answered: {stats.total}</p>
        <p>Correct answers: {stats.correct}</p>
        <p className="text-lg font-bold">Score: {stats.percentage}%</p>
      </div>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
        onClick={toggleAnsweredQuestions}
      >
        {showAnswered ? "Show Current Question" : "View Answered Questions"}
      </button>

      {!showAnswered && currentQuestion ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">
              Question {currentQuestion.number}
            </h2>
            <p className="text-lg mb-4">{currentQuestion.question}</p>
            <div className="answers-container space-y-2">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-3 border rounded transition-all duration-200
                    ${
                      selectedAnswerIndex === index
                        ? answeredCorrectly
                          ? "bg-green-100 border-green-500 text-green-800"
                          : "bg-red-100 border-red-500 text-red-800"
                        : correctAnswerIndex === index
                        ? "bg-green-100 border-green-500 text-green-800" // Highlight correct answer
                        : "bg-white border-gray-300 hover:bg-gray-100"
                    }
                    ${
                      evaluatingAnswer &&
                      selectedAnswerIndex !== index &&
                      correctAnswerIndex !== index
                        ? "opacity-50"
                        : ""
                    }`}
                  onClick={() => handleAnswer(answer, index)}
                  disabled={evaluatingAnswer}
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : showAnswered ? (
        <div className="answered-questions">
          <h2 className="text-xl font-bold mb-4">Answered Questions</h2>
          {answeredQuestions.length === 0 ? (
            <p>No questions answered yet.</p>
          ) : (
            answeredQuestions.map((item, index) => (
              <Card
                key={index}
                className={`mb-4 ${
                  item.wasCorrect ? "border-green-500" : "border-red-500"
                }`}
              >
                <CardContent className="p-4">
                  <h3 className="font-bold">Question {item.question.number}</h3>
                  <p className="mb-2">{item.question.question}</p>
                  <p>
                    Your answer:{" "}
                    <span
                      className={
                        item.wasCorrect
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {item.selectedAnswer}
                    </span>
                  </p>
                  {!item.wasCorrect && (
                    <p className="text-green-600">
                      Correct answer:{" "}
                      {item.question.answers.find((a) => a.correct)?.text}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <p className="text-center">Loading questions...</p>
      )}
    </div>
  );
}

export default App;
