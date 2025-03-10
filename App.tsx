import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

// Define types for the flashcard data
interface Flashcard {
  question: string;
  answer: string;
}

// Define types for styles to avoid TypeScript errors
interface Styles {
  container: ViewStyle;
  input: ViewStyle;
  cardContainer: ViewStyle;
  cardFace: ViewStyle;
  cardBack: ViewStyle;
  question: TextStyle;
  answer: TextStyle;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const generateFlashcards = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Generate 5 flashcard questions and answers about ${prompt}. Format each as: Q: [question] A: [answer]`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer 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`,
          },
        }
      );

      const text: string = response.data.choices[0].message.content;
      const parsedFlashcards: Flashcard[] = parseResponse(text);
      setFlashcards(parsedFlashcards);
    } catch (error: any) {
      console.error('Error generating flashcards:', error.response ? error.response.data : error.message);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseResponse = (text: string): Flashcard[] => {
    const flashcards: Flashcard[] = [];
    const lines: string[] = text.trim().split('\n');
    let currentQuestion: string = '';
    let currentAnswer: string = '';

    lines.forEach((line: string) => {
      if (line.startsWith('Q:')) {
        if (currentQuestion && currentAnswer) {
          flashcards.push({ question: currentQuestion, answer: currentAnswer });
        }
        currentQuestion = line.substring(2).trim();
        currentAnswer = '';
      } else if (line.startsWith('A:')) {
        currentAnswer = line.substring(2).trim();
      }
    });
    if (currentQuestion && currentAnswer) {
      flashcards.push({ question: currentQuestion, answer: currentAnswer });
    }
    return flashcards;
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Enter a topic (e.g., World War II)"
      />
      <Button title="Generate Flashcards" onPress={generateFlashcards} />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={flashcards}
          renderItem={({ item }) => <Flashcard item={item} />}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );
};

// Custom Flashcard Component with Flip Animation
interface FlashcardProps {
  item: Flashcard;
}

const Flashcard: React.FC<FlashcardProps> = ({ item }) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const flipAnimation = useState(new Animated.Value(0))[0];

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity onPress={flipCard}>
        <Animated.View
          style={[styles.cardFace, { transform: [{ rotateY: frontInterpolate }] }]}
        >
          <Text style={styles.question}>{item.question}</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }] },
          ]}
        >
          <Text style={styles.answer}>{item.answer}</Text>
        </Animated.View>
      </TouchableOpacity>
      <Button
        title="Known"
        onPress={() => {
          console.log('Marked as known:', item.question);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  cardContainer: {
    marginVertical: 10,
  },
  cardFace: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  answer: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default App;