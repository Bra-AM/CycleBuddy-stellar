import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
  VStack,
  Checkbox,
  Button,
  Text,
} from '@chakra-ui/react';
import 'react-calendar/dist/Calendar.css';
import './styles/calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DayData {
  flow: boolean;
  cramps: boolean;
  mood: boolean;
}

type CalendarData = {
  [date: string]: DayData;
};

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData>(() => {
    const savedData = localStorage.getItem('calendarData');
    return savedData ? JSON.parse(savedData) : {};
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
  }, [calendarData]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Initialize data for new date if it doesn't exist
    const dateStr = date.toISOString().split('T')[0];
    if (!calendarData[dateStr]) {
      setCalendarData(prev => ({
        ...prev,
        [dateStr]: { flow: false, cramps: false, mood: false }
      }));
    }
  };

  const handleCheckboxChange = (field: keyof DayData) => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: !prev[dateStr][field]
      }
    }));
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const data = calendarData[dateStr];
    
    if (data?.flow) {
      return (
        <Box 
          width="8px" 
          height="8px" 
          borderRadius="50%" 
          bg="red.500" 
          position="absolute"
          bottom="4px"
          left="50%"
          transform="translateX(-50%)"
        />
      );
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="900px">
        <ModalHeader>Track Your Cycle</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Flex>
            <Box flex="1" className="calendar-container">
              <Calendar
                className="custom-calendar"
                onClickDay={handleDateClick}
                value={selectedDate}
                tileContent={tileContent}
              />
            </Box>
            
            {selectedDate && (
              <Box ml={6} width="200px">
                <Text mb={4} fontWeight="bold">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                <VStack align="start" spacing={3}>
                  <Checkbox
                    isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.flow}
                    onChange={() => handleCheckboxChange('flow')}
                  >
                    Flow
                  </Checkbox>
                  <Checkbox
                    isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.cramps}
                    onChange={() => handleCheckboxChange('cramps')}
                  >
                    Cramps
                  </Checkbox>
                  <Checkbox
                    isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.mood}
                    onChange={() => handleCheckboxChange('mood')}
                  >
                    Mood
                  </Checkbox>
                </VStack>
              </Box>
            )}
          </Flex>
          
          <Box position="absolute" bottom="6" right="6">
            <Button colorScheme="purple">
              Save
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CalendarModal; 